import express from 'express';
import { sendHandoverKeyEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * @route   POST /api/email/send-handover-key
 * @desc    Send handover key to intended recipient via email
 * @access  Public (called from frontend after blockchain transaction)
 */
router.post('/send-handover-key', async (req, res) => {
    try {
        const { recipientEmail, productId, productName, handoverKey } = req.body;

        // Validate required fields
        if (!recipientEmail || !productId || !handoverKey) {
            return res.status(400).json({
                success: false,
                message: 'recipientEmail, productId, and handoverKey are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format'
            });
        }

        // Check email config is set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('EMAIL_USER or EMAIL_PASS not configured in .env');
            return res.status(500).json({
                success: false,
                message: 'Email service is not configured on the server'
            });
        }

        await sendHandoverKeyEmail(recipientEmail, productId, productName, handoverKey);

        res.json({
            success: true,
            message: `Handover key email sent successfully to ${recipientEmail}`
        });

    } catch (error) {
        console.error('Send handover key email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send handover key email',
            error: error.message
        });
    }
});

export default router;
