import express from 'express';
import { getCertificatesForProduct, getCertificateFile } from '../controllers/certificateController.js';

const router = express.Router();

// Get certificates for a product's manufacturer (changed to GET)
router.get('/:productId', getCertificatesForProduct);

// Serve certificate file
router.get('/file/:filename', getCertificateFile);

export default router;
