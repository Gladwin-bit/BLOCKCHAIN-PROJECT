import User from '../models/User.js';

/**
 * @route   GET /api/certificates/:productId
 * @desc    Get manufacturer certificate (simplified - no blockchain)
 * @access  Public
 */
export const getCertificatesForProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        console.log('=== CERTIFICATE REQUEST ===');
        console.log('Product ID:', productId);

        // Import contract configuration
        const { ethers } = await import('ethers');
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const { dirname } = await import('path');

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);

        // Load contract ABI and address - go up from backend/controllers to project root
        const projectRoot = path.join(__dirname, '..', '..');
        const contractAddressPath = path.join(projectRoot, 'frontend', 'src', 'contract-address.json');
        const contractABIPath = path.join(projectRoot, 'frontend', 'src', 'SupplyChain.json');

        console.log('Contract address path:', contractAddressPath);
        console.log('Contract ABI path:', contractABIPath);

        console.log('Loading contract configuration...');
        const addressData = JSON.parse(fs.readFileSync(contractAddressPath, 'utf8'));
        const contractAddress = addressData.address;

        const abiData = JSON.parse(fs.readFileSync(contractABIPath, 'utf8'));
        const contractABI = abiData.abi;

        // Connect to blockchain
        console.log('Connecting to blockchain...');
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const contract = new ethers.Contract(contractAddress, contractABI, provider);

        // Get product history to find manufacturer (first entry)
        console.log('Fetching product history...');
        const history = await contract.getHistory(productId);

        if (!history || history.length === 0) {
            console.log('No history found for product');
            return res.status(404).json({
                success: false,
                message: 'Product not found or has no history'
            });
        }

        // Get manufacturer wallet address (first entry in history is the creator)
        const manufacturerAddress = history[0].actor.toLowerCase();
        console.log('Manufacturer address from blockchain:', manufacturerAddress);

        // Find manufacturer in database by wallet address (case-insensitive)
        console.log('Searching for manufacturer in database...');
        const manufacturer = await User.findOne({
            walletAddress: { $regex: new RegExp(`^${manufacturerAddress}$`, 'i') }
        }).select('name email role walletAddress certificate idProof');

        // If not found with regex, try exact match
        if (!manufacturer) {
            console.log('Not found with regex, trying exact match...');
            const exactMatch = await User.findOne({
                walletAddress: manufacturerAddress
            }).select('name email role walletAddress certificate idProof');

            if (!exactMatch) {
                // Debug: Show all manufacturers in database
                console.log('Still not found. Checking all users with manufacturer role...');
                const allManufacturers = await User.find({ role: 'manufacturer' })
                    .select('name walletAddress')
                    .limit(5);
                console.log('Manufacturers in database:', allManufacturers.map(m => ({
                    name: m.name,
                    wallet: m.walletAddress
                })));

                console.log('Manufacturer not found in database');
                return res.status(404).json({
                    success: false,
                    message: 'Manufacturer not registered in the system',
                    debug: {
                        searchedAddress: manufacturerAddress,
                        foundManufacturers: allManufacturers.length
                    }
                });
            }

            manufacturer = exactMatch;
        }

        console.log('Using manufacturer:', manufacturer.name);

        const certificateData = {
            name: manufacturer.name,
            email: manufacturer.email,
            role: manufacturer.role,
            walletAddress: manufacturer.walletAddress,
            hasCertificate: !!manufacturer.certificate,
            hasIdProof: !!manufacturer.idProof
        };

        if (manufacturer.certificate) {
            certificateData.certificate = {
                filename: manufacturer.certificate.filename,
                uploadedAt: manufacturer.certificate.uploadedAt,
                url: `/uploads/${manufacturer.certificate.filename}`
            };
        }

        if (manufacturer.idProof) {
            certificateData.idProof = {
                filename: manufacturer.idProof.filename,
                uploadedAt: manufacturer.idProof.uploadedAt,
                url: `/uploads/${manufacturer.idProof.filename}`
            };
        }

        // Get product certificate from blockchain
        console.log('Fetching product from blockchain...');
        try {
            const product = await contract.getProduct(productId);
            console.log('Product data from blockchain:', {
                id: product.id?.toString(),
                name: product.name,
                exists: product.exists,
                productCertificate: product.productCertificate
            });

            const productCertificate = product.productCertificate || '';

            console.log('Product certificate filename:', productCertificate);
            console.log('Product certificate exists:', !!productCertificate);

            const response = {
                success: true,
                productId,
                certificates: [certificateData],
                manufacturer: certificateData
            };

            // Add product certificate if it exists
            if (productCertificate && productCertificate.trim() !== '') {
                response.productCertificate = {
                    filename: productCertificate,
                    url: `/uploads/product-certificates/${productCertificate}`
                };
                console.log('✅ Product certificate added to response');
            } else {
                console.log('⚠️ No product certificate found for this product');
            }

            console.log('Sending certificate data for:', manufacturer.name);
            res.json(response);
        } catch (blockchainError) {
            console.error('Blockchain fetch error:', blockchainError);
            // Continue without product certificate
            console.log('Sending response without product certificate');
            res.json({
                success: true,
                productId,
                certificates: [certificateData],
                manufacturer: certificateData
            });
        }

    } catch (error) {
        console.error('=== CERTIFICATE ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve certificates',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/certificates/file/:filename
 * @desc    Serve certificate file
 * @access  Public
 */
export const getCertificateFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const uploadsDir = process.env.UPLOAD_PATH || './uploads';
        const filePath = path.join(uploadsDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Certificate file not found'
            });
        }

        // Send file
        res.sendFile(path.resolve(filePath));

    } catch (error) {
        console.error('Get certificate file error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve certificate file',
            error: error.message
        });
    }
};
