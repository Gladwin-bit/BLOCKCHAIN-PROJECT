import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for product certificate uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        const productCertPath = path.join(uploadPath, 'product-certificates');

        // Create directory if it doesn't exist
        if (!fs.existsSync(productCertPath)) {
            fs.mkdirSync(productCertPath, { recursive: true });
        }

        cb(null, productCertPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-cert-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|png|jpg|jpeg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed'));
        }
    }
});

/**
 * @route   POST /api/products/upload-certificate
 * @desc    Upload product certificate and return filename
 * @access  Private (requires authentication)
 */
router.post('/upload-certificate', upload.single('certificate'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        res.json({
            success: true,
            filename: req.file.filename,
            path: req.file.path,
            message: 'Certificate uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload certificate',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/products/upload-materials-metadata
 * @desc    Upload materials metadata JSON (threads, dyes, fabric sources)
 * @access  Private
 */
router.post('/upload-materials-metadata', (req, res) => {
    try {
        const { productName, materials } = req.body;

        if (!materials) {
            return res.status(400).json({
                success: false,
                message: 'Materials data is required'
            });
        }

        // Create metadata directory if it doesn't exist
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        const metadataPath = path.join(uploadPath, 'materials-metadata');

        if (!fs.existsSync(metadataPath)) {
            fs.mkdirSync(metadataPath, { recursive: true });
        }

        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `materials-${uniqueSuffix}.json`;
        const filepath = path.join(metadataPath, filename);

        // Prepare metadata object
        const metadata = {
            productName: productName || 'Untitled',
            uploadDate: new Date().toISOString(),
            ...materials
        };

        // Write JSON file
        fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2), 'utf8');

        res.json({
            success: true,
            filename: filename,
            path: filepath,
            message: 'Materials metadata uploaded successfully'
        });
    } catch (error) {
        console.error('Materials metadata upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload materials metadata',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/products/materials-metadata/:filename
 * @desc    Retrieve materials metadata file
 * @access  Public
 */
router.get('/materials-metadata/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        const filePath = path.join(uploadPath, 'materials-metadata', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Materials metadata file not found'
            });
        }

        const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        res.json({
            success: true,
            metadata
        });
    } catch (error) {
        console.error('Get materials metadata error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve materials metadata',
            error: error.message
        });
    }
});


/**
 * @route   GET /api/products/certificate/:filename
 * @desc    Serve product certificate file
 * @access  Public
 */
router.get('/certificate/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        const filePath = path.join(uploadPath, 'product-certificates', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Certificate file not found'
            });
        }

        res.sendFile(path.resolve(filePath));
    } catch (error) {
        console.error('Get certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve certificate',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/products/register
 * @desc    Save product to database after blockchain creation
 * @access  Private
 */
router.post('/register', async (req, res) => {
    try {
        const { productId, name, manufacturerAddress, consumerSecretHash, certificateFilename, certificatePath, txHash, loomLocation, weaveDate } = req.body;

        // Validate required fields
        if (!productId || !name || !manufacturerAddress || !certificateFilename) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Import Product model
        const Product = (await import('../models/Product.js')).default;
        const User = (await import('../models/User.js')).default;

        // Find manufacturer by wallet address
        const manufacturer = await User.findOne({
            walletAddress: { $regex: new RegExp(`^${manufacturerAddress}$`, 'i') }
        });

        if (!manufacturer) {
            return res.status(404).json({
                success: false,
                message: 'Manufacturer not found in database'
            });
        }

        // Create product record
        const product = await Product.create({
            productId: parseInt(productId),
            name,
            description: req.body.description || "",
            manufacturer: manufacturer._id,
            manufacturerAddress: manufacturerAddress.toLowerCase(),
            loomLocation: loomLocation || "Not Specified",
            weaveDate: weaveDate || new Date(),
            consumerSecretHash,
            currentHandoverKey: req.body.currentHandoverKey || null, // Save handover key for rolling mechanism
            productCertificate: {
                filename: certificateFilename,
                path: certificatePath || `uploads/product-certificates/${certificateFilename}`,
                uploadedAt: new Date()
            },
            blockchainTxHash: txHash
        });

        console.log('Product saved to database:', product.productId);

        res.json({
            success: true,
            message: 'Product registered in database',
            product: {
                id: product.productId,
                name: product.name,
                manufacturer: manufacturer.name
            }
        });

    } catch (error) {
        console.error('Product registration error:', error);

        // Handle duplicate product ID
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Product ID already exists in database'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to register product',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/products/:productId
 * @desc    Get product details from database
 * @access  Public
 */
router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        const Product = (await import('../models/Product.js')).default;

        const product = await Product.findOne({ productId: parseInt(productId) })
            .populate('manufacturer', 'name email walletAddress');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in database'
            });
        }

        res.json({
            success: true,
            product: {
                id: product.productId,
                name: product.name,
                manufacturer: product.manufacturer,
                certificate: {
                    filename: product.productCertificate.filename,
                    url: `/uploads/product-certificates/${product.productCertificate.filename}`,
                    uploadedAt: product.productCertificate.uploadedAt
                },
                createdAt: product.createdAt
            }
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve product',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/products/:id/handover-key
 * @desc    Get the current handover key for a product
 * @access  Public
 */
router.get('/:id/handover-key', async (req, res) => {
    try {
        const { id } = req.params;
        const Product = (await import('../models/Product.js')).default;
        const product = await Product.findOne({ productId: parseInt(id) });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            handoverKey: product.currentHandoverKey,
            productId: product.productId
        });
    } catch (error) {
        console.error('Get handover key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get handover key',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/products/:id/handover-key
 * @desc    Update the current handover key for a product
 * @access  Public
 */
router.put('/:id/handover-key', async (req, res) => {
    try {
        const { id } = req.params;
        const { handoverKey } = req.body;

        if (!handoverKey) {
            return res.status(400).json({
                success: false,
                message: 'Handover key is required'
            });
        }

        const Product = (await import('../models/Product.js')).default;
        const product = await Product.findOneAndUpdate(
            { productId: parseInt(id) },
            { currentHandoverKey: handoverKey },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Handover key updated successfully',
            productId: product.productId
        });
    } catch (error) {
        console.error('Update handover key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update handover key',
            error: error.message
        });
    }
});

export default router;
