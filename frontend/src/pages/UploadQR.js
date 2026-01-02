// src/pages/UploadQR.js
import React, { useState } from "react";
import { useSupplyChain } from "../hooks/useSupplyChain";
import ProductTimeline from "../components/ProductTimeline";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "./UploadQR.css";

const UploadQR = () => {
    const { account, connectWallet, getProductData } = useSupplyChain();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleQRUpload = async (file) => {
        if (!account) {
            toast.error("⚠️ Please connect your wallet first");
            return;
        }

        if (!file) {
            toast.error("⚠️ Please select a QR code image");
            return;
        }

        setLoading(true);
        setProduct(null);

        try {
            // Read the QR code image
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    // Use jsQR library to decode QR code
                    const image = new Image();
                    image.src = e.target.result;

                    image.onload = async () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = image.width;
                        canvas.height = image.height;
                        ctx.drawImage(image, 0, 0);

                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                        // Import jsQR dynamically
                        const jsQR = (await import('jsqr')).default;
                        const code = jsQR(imageData.data, imageData.width, imageData.height);

                        if (code) {
                            // Parse the QR code data
                            const qrData = JSON.parse(code.data);
                            const productId = qrData.productId || qrData.id;

                            if (productId) {
                                // Fetch product details from blockchain
                                const productData = await getProductData(productId);
                                setProduct(productData);
                                toast.success(`Product #${productId} loaded successfully!`);
                            } else {
                                toast.error("❌ Invalid QR code format");
                            }
                        } else {
                            toast.error("❌ No QR code found in image");
                        }
                        setLoading(false);
                    };
                } catch (error) {
                    console.error(error);
                    toast.error("❌ Failed to decode QR code");
                    setLoading(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            toast.error("❌ Failed to process QR code");
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleQRUpload(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleQRUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="upload-qr-page">
            <div className="upload-qr-container glass">
                <div className="page-header">
                    <h1>📤 Upload QR Code</h1>
                    <p className="page-description">
                        Upload or drag & drop a QR code image to view product details
                    </p>
                </div>

                {!account ? (
                    <motion.div
                        className="connect-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="connect-prompt">
                            <span className="connect-icon">🔐</span>
                            <h3>Connect Your Wallet</h3>
                            <p>You need to connect MetaMask to view product details</p>
                        </div>
                        <button className="btn btn-connect" onClick={connectWallet}>
                            Connect MetaMask
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        className="upload-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div
                            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="qr-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="qr-upload" className="upload-label">
                                <div className="upload-icon">📷</div>
                                <h3>Upload QR Code Image</h3>
                                <p>Click to browse or drag & drop</p>
                                <span className="upload-hint">Supports: JPG, PNG, WebP</span>
                            </label>
                        </div>

                        {loading && <LoadingSpinner message="Decoding QR code and fetching product data..." />}

                        {product && !loading && (
                            <motion.div
                                className="product-details"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="product-header">
                                    <h2>📦 Product Details</h2>
                                </div>

                                <div className="product-info-grid">
                                    <div className="info-card">
                                        <span className="info-label">🔢 Product ID</span>
                                        <span className="info-value">{product.id}</span>
                                    </div>
                                    <div className="info-card">
                                        <span className="info-label">📝 Name</span>
                                        <span className="info-value">{product.name}</span>
                                    </div>
                                    <div className="info-card">
                                        <span className="info-label">📦 Batch ID</span>
                                        <span className="info-value">{product.batchId}</span>
                                    </div>
                                    <div className="info-card">
                                        <span className="info-label">👤 Current Owner</span>
                                        <span className="info-value owner-address">
                                            {product.currentOwner?.slice(0, 6)}...{product.currentOwner?.slice(-4)}
                                        </span>
                                    </div>
                                    <div className="info-card">
                                        <span className="info-label">📊 Status</span>
                                        <span className={`info-value status-badge status-${product.state?.toLowerCase()}`}>
                                            {product.state}
                                        </span>
                                    </div>
                                    <div className="info-card">
                                        <span className="info-label">✅ Verified</span>
                                        <span className="info-value">
                                            {product.isConsumed ? "Yes ✓" : "Not Yet"}
                                        </span>
                                    </div>
                                </div>

                                {product.history && product.history.length > 0 && (
                                    <ProductTimeline history={product.history} />
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default UploadQR;
