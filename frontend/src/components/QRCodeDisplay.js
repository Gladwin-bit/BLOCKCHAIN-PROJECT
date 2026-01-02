// src/components/QRCodeDisplay.js
import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import './QRCodeDisplay.css';

const QRCodeDisplay = ({ productId, secretCode }) => {
    const qrRef = useRef();

    const downloadQR = () => {
        const svg = qrRef.current.querySelector('svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `product-${productId}-qr.png`;
            downloadLink.href = pngFile;
            downloadLink.click();

            toast.success('QR Code downloaded successfully!');
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const copyToClipboard = () => {
        const data = JSON.stringify({ productId, secretCode });
        navigator.clipboard.writeText(data);
        toast.info('Product data copied to clipboard!');
    };

    return (
        <div className="qr-code-container glass">
            <h3>🔐 Product QR Code</h3>

            {/* Product Information */}
            <div className="product-info-display">
                <div className="info-row">
                    <span className="info-label">Product ID:</span>
                    <span className="info-value-display">{productId}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Secret Code:</span>
                    <span className="info-value-display secret-code">{secretCode}</span>
                </div>
            </div>

            <div className="qr-code-wrapper" ref={qrRef}>
                <QRCodeSVG
                    value={JSON.stringify({ productId, secretCode })}
                    size={150}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                />
            </div>
            <div className="qr-actions">
                <button className="btn btn-download" onClick={downloadQR}>
                    📥 Download QR
                </button>
                <button className="btn btn-copy" onClick={copyToClipboard}>
                    📋 Copy Data
                </button>
            </div>
            <p className="qr-info">
                Scan this code to verify product authenticity
            </p>
        </div>
    );
};

export default QRCodeDisplay;
