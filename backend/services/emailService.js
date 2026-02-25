import nodemailer from 'nodemailer';

// Create Gmail SMTP transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS  // Gmail App Password (not your regular password)
        }
    });
};

/**
 * Send handover key email to the intended recipient
 * @param {string} recipientEmail - Email of the next custodian
 * @param {number|string} productId - Product ID
 * @param {string} productName - Product name for display
 * @param {string} handoverKey - The handover key to send
 */
export const sendHandoverKeyEmail = async (recipientEmail, productId, productName, handoverKey) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Kasaragod Sarees Supply Chain" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `🔑 Handover Key for Product #${productId} — ${productName || 'Supply Chain Asset'}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Handover Key</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;overflow:hidden;border:1px solid rgba(212,175,55,0.2);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#D4AF37 0%,#FFD700 100%);padding:32px 40px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🧵</div>
      <h1 style="margin:0;color:#1a1a2e;font-size:22px;font-weight:700;letter-spacing:1px;">KASARAGOD SAREES</h1>
      <p style="margin:6px 0 0;color:#2d2d2d;font-size:13px;letter-spacing:2px;">BLOCKCHAIN SUPPLY CHAIN</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="color:#D4AF37;margin:0 0 8px;font-size:20px;">🔑 Your Handover Key Has Arrived</h2>
      <p style="color:#a0aec0;margin:0 0 28px;font-size:14px;line-height:1.6;">
        A custody transfer has been initiated for the following asset. Use the key below to accept the handover on the platform.
      </p>

      <!-- Product Info -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:12px;padding:24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Product</td>
            <td style="color:#e2e8f0;font-size:14px;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${productName || 'Supply Chain Asset'}</td>
          </tr>
          <tr>
            <td style="color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;">Product ID</td>
            <td style="color:#e2e8f0;font-size:14px;font-weight:600;text-align:right;padding:8px 0;">#${productId}</td>
          </tr>
        </table>
      </div>

      <!-- Handover Key Box -->
      <div style="background:linear-gradient(135deg,rgba(212,175,55,0.08) 0%,rgba(212,175,55,0.04) 100%);border:2px solid rgba(212,175,55,0.4);border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
        <p style="color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Your Handover Key</p>
        <div style="font-size:36px;font-weight:700;color:#D4AF37;letter-spacing:6px;font-family:'Courier New',monospace;">${handoverKey}</div>
      </div>

      <!-- Instructions -->
      <div style="background:rgba(255,255,255,0.03);border-left:3px solid #D4AF37;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
        <p style="color:#a0aec0;font-size:13px;line-height:1.7;margin:0;">
          <strong style="color:#e2e8f0;">How to use this key:</strong><br>
          1. Open the Supply Chain platform and go to <strong style="color:#D4AF37;">Manage Custody</strong><br>
          2. Upload the waybill QR provided by the sender<br>
          3. Enter this handover key in the <em>Secret Handover Key</em> field<br>
          4. Click <strong>Accept Custody</strong> to complete the transfer
        </p>
      </div>

      <p style="color:#4a5568;font-size:12px;text-align:center;margin:0;">
        ⚠️ Keep this key confidential. Do not share it with anyone other than the intended custodian.<br>
        This is an automated message from the Kasaragod Sarees Blockchain Supply Chain system.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:rgba(0,0,0,0.3);padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="color:#4a5568;font-size:11px;margin:0;">© 2025 Kasaragod Sarees Supply Chain · Powered by Blockchain Technology</p>
    </div>
  </div>
</body>
</html>
        `,
        text: `
KASARAGOD SAREES BLOCKCHAIN SUPPLY CHAIN
=========================================

Your Handover Key Has Arrived

Product: ${productName || 'Supply Chain Asset'}
Product ID: #${productId}

YOUR HANDOVER KEY: ${handoverKey}

How to use:
1. Open the Supply Chain platform → Manage Custody
2. Upload the waybill QR from the sender
3. Enter this key in the "Secret Handover Key" field
4. Click "Accept Custody"

Keep this key confidential.
This is an automated message from the Kasaragod Sarees Blockchain Supply Chain system.
        `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Handover key email sent to ${recipientEmail}: ${info.messageId}`);
    return info;
};
