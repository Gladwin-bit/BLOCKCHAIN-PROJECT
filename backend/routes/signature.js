import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import digitalSignatureService from '../services/digitalSignatureService.js';

const router = express.Router();

// Configure multer for temporary file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/temp';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'verify-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Only accept PDF files for digital signature verification
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files can be verified for digital signatures'));
        }
    }
});

/**
 * @route   POST /api/signature/verify
 * @desc    Verify digital signature in uploaded PDF
 * @access  Public
 */
router.post('/verify', upload.single('certificate'), async (req, res) => {
    let tempFilePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        tempFilePath = req.file.path;

        // Verify the digital signature
        const verificationResult = await digitalSignatureService.verifyDigitalSignature(tempFilePath);

        // Clean up temporary file
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        // Return verification result
        res.json({
            success: verificationResult.success,
            verified: verificationResult.verified,
            message: verificationResult.message,
            signatureCount: verificationResult.signatureCount,
            details: verificationResult.details,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('Signature verification error:', error);

        // Clean up temporary file on error
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        res.status(500).json({
            success: false,
            verified: false,
            message: error.message || 'Failed to verify digital signature',
            error: error.message
        });
    }
});

export default router;
