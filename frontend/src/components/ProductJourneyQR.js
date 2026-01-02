// src/components/ProductJourneyQR.js
import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import './ProductJourneyQR.css';

const ProductJourneyQR = ({ productId, productName, journey }) => {
    const qrRef = useRef();

    // Create journey data for QR code
    const journeyData = {
        productId,
        productName,
        totalSteps: journey?.length || 0,
        currentStatus: journey?.[journey.length - 1]?.status || 'Created',
        journey: journey?.map(step => ({
            status: step.status,
            location: step.location,
            timestamp: step.timestamp,
            handler: step.handler
        })) || []
    };

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
            downloadLink.download = `product-${productId}-journey-qr.png`;
            downloadLink.href = pngFile;
            downloadLink.click();

            toast.success('Journey QR Code downloaded!');
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const copyJourneyData = () => {
        const data = JSON.stringify(journeyData, null, 2);
        navigator.clipboard.writeText(data);
        toast.info('Journey data copied to clipboard!');
    };

    return (
        <div className="journey-qr-container glass">
            <h3>🗺️ Product Journey QR Code</h3>

            <div className="journey-summary">
                <div className="summary-item">
                    <span className="summary-label">Total Steps:</span>
                    <span className="summary-value">{journeyData.totalSteps}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Current Status:</span>
                    <span className={`summary-value status-${journeyData.currentStatus.toLowerCase()}`}>
                        {journeyData.currentStatus}
                    </span>
                </div>
            </div>

            <div className="qr-code-wrapper" ref={qrRef}>
                <QRCodeSVG
                    value={JSON.stringify(journeyData)}
                    size={200}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                />
            </div>

            <div className="qr-actions">
                <button className="btn btn-download" onClick={downloadQR}>
                    📥 Download Journey QR
                </button>
                <button className="btn btn-copy" onClick={copyJourneyData}>
                    📋 Copy Journey Data
                </button>
            </div>

            <p className="qr-info">
                Scan this code to view the complete product journey
            </p>
        </div>
    );
};

export default ProductJourneyQR;
