import React, { useState } from "react";
import { useSupplyChain } from "../hooks/useSupplyChain";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
    ShieldCheck,
    QrCode,
    Package,
    User,
    MapPin,
    Clock,
    AlertTriangle,
    CheckCircle2,
    FileText,
    Upload
} from "lucide-react";
import { getLocationString, isGeolocationAvailable } from "../utils/geolocation";
import CertificateViewer from "../components/CertificateViewer";
import "./VerifyProduct.css";

const VerifyProduct = () => {
    const { account, connectWallet, claimCustomerOwnership, getProductData } = useSupplyChain();
    const [productId, setProductId] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [status, setStatus] = useState({ type: "", msg: "", title: "", icon: null });
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState(null);
    const [showCertificates, setShowCertificates] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [waybillFile, setWaybillFile] = useState(null);
    const [waybillUploaded, setWaybillUploaded] = useState(false);
    const [activeTab, setActiveTab] = useState('manual');

    // Handle waybill QR upload
    const handleWaybillUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        setWaybillFile(file);

        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const html5QrCode = new Html5Qrcode("qr-reader-hidden");

            const qrCodeSuccessCallback = async (decodedText) => {
                try {
                    console.log("Waybill QR Scanned:", decodedText);
                    const waybillData = JSON.parse(decodedText);

                    if (waybillData.productId) {
                        setProductId(waybillData.productId);
                        setWaybillUploaded(true);
                        toast.success("Waybill scanned! Now enter your scratch-off code.");
                        setStatus({
                            type: "info",
                            title: "WAYBILL VERIFIED",
                            msg: `Product #${waybillData.productId} identified. Enter your scratch-off code to verify authenticity.`,
                            icon: <CheckCircle2 className="status-icon" />
                        });
                    } else {
                        throw new Error("Invalid waybill format");
                    }
                } catch (parseError) {
                    console.error("Parse error:", parseError);
                    toast.error("Invalid waybill QR code");
                    setStatus({
                        type: "error",
                        title: "INVALID WAYBILL",
                        msg: "The QR code is not a valid waybill.",
                        icon: <AlertTriangle className="status-icon" />
                    });
                }
                html5QrCode.clear();
            };

            await html5QrCode.scanFile(file, true)
                .then(qrCodeSuccessCallback)
                .catch(err => {
                    console.error("QR scan error:", err);
                    toast.error("Failed to read QR code");
                });

        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to process waybill");
        } finally {
            setLoading(false);
        }
    };

    const handleManualVerify = async () => {
        if (!productId || !secretCode) {
            toast.warn("Please upload waybill and enter scratch-off code");
            return;
        }

        setLoading(true);
        setStatus({
            type: "loading",
            title: "VERIFYING ASSET",
            msg: "Checking blockchain records...",
            icon: <ShieldCheck className="status-icon animate-spin" />
        });

        try {
            const data = await getProductData(productId);
            setProduct(data);

            // Fetch the Keccak256 hash of the entered secret to compare
            const { ethers } = await import("ethers");
            const inputHash = ethers.keccak256(ethers.toUtf8Bytes(secretCode));

            if (data.consumerSecretHash === inputHash) {
                if (data.isConsumed || (data.customerClaim && data.customerClaim.isClaimed)) {
                    setStatus({
                        type: "info",
                        title: "ALREADY CLAIMED",
                        msg: "This product is authentic but has already been claimed.",
                        icon: <CheckCircle2 className="status-icon" />
                    });
                } else {
                    setStatus({
                        type: "success",
                        title: "AUTHENTICITY VERIFIED",
                        msg: "Secret key matches! You can now claim ownership below.",
                        icon: <ShieldCheck className="status-icon" />
                    });
                    toast.success("✅ Asset Verified Successfully!");
                }
            } else {
                setStatus({
                    type: "error",
                    title: "VERIFICATION FAILED",
                    msg: "The secret key entered does not match this product's record.",
                    icon: <AlertTriangle className="status-icon" />
                });
                toast.error("Verification failed: Invalid Secret Key");
            }
        } catch (err) {
            console.error(err);
            setStatus({
                type: "error",
                title: "NOT FOUND",
                msg: `Product #${productId} could not be located on the blockchain.`,
                icon: <AlertTriangle className="status-icon" />
            });
            toast.error("Product not found");
        } finally {
            setLoading(false);
        }
    };

    const handleQRUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const image = new Image();
            image.src = event.target.result;
            image.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                const jsQR = (await import('jsqr')).default;
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    try {
                        const qrData = JSON.parse(code.data);
                        const scannedId = qrData.productId || qrData.id;
                        const scannedSecret = qrData.secretCode || qrData.secret;

                        if (scannedId && scannedSecret) {
                            setProductId(scannedId);
                            setSecretCode(scannedSecret);

                            // Fetch product data
                            const data = await getProductData(scannedId);
                            setProduct(data);

                            // Check if already claimed
                            if (data.customerClaim && data.customerClaim.isClaimed) {
                                setStatus({
                                    type: "info",
                                    title: "ALREADY CLAIMED",
                                    msg: "This product has already been claimed by a customer.",
                                    icon: <CheckCircle2 className="status-icon" />
                                });
                            } else {
                                setStatus({
                                    type: "success",
                                    title: "PRODUCT VERIFIED",
                                    msg: "QR code is valid. You can claim ownership of this product.",
                                    icon: <ShieldCheck className="status-icon" />
                                });
                            }

                            toast.success("QR Scanned Successfully!");
                        } else {
                            toast.error("Invalid QR code format");
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error("Invalid QR format");
                    }
                } else {
                    toast.error("No QR code found in image");
                }
                setLoading(false);
            };
        };
        reader.readAsDataURL(file);
    };

    const handleClaimOwnership = async () => {
        if (!account) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!productId || !secretCode) {
            toast.error("Please scan a valid QR code first");
            return;
        }

        if (!customerName.trim()) {
            toast.error("Please enter your name");
            return;
        }

        if (!isGeolocationAvailable()) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        setLocationLoading(true);
        setStatus({
            type: "loading",
            title: "FETCHING LOCATION",
            msg: "Please allow location access when prompted...",
            icon: <MapPin className="status-icon animate-pulse" />
        });

        try {
            // Get user's location
            const location = await getLocationString();
            setLocationLoading(false);

            setStatus({
                type: "loading",
                title: "CLAIMING OWNERSHIP",
                msg: "Processing your claim on the blockchain...",
                icon: <Package className="status-icon animate-spin" />
            });

            // Claim ownership on blockchain
            const result = await claimCustomerOwnership(productId, secretCode, customerName, location);

            if (result.status === "claimed") {
                // Refresh product data
                const updatedData = await getProductData(productId);
                setProduct(updatedData);

                setStatus({
                    type: "success",
                    title: "OWNERSHIP CLAIMED",
                    msg: "Congratulations! You are now the verified owner of this product.",
                    icon: <CheckCircle2 className="status-icon" />
                });
            } else {
                setStatus({
                    type: "error",
                    title: "CLAIM FAILED",
                    msg: "Failed to claim ownership. Please try again.",
                    icon: <AlertTriangle className="status-icon" />
                });
            }
        } catch (error) {
            console.error("=== CLAIM OWNERSHIP ERROR ===");
            console.error("Full error:", error);
            console.error("Error message:", error.message);
            console.error("Error reason:", error.reason);
            console.error("Error code:", error.code);
            console.error("Error data:", error.data);
            setLocationLoading(false);

            let errorMsg = "Failed to claim ownership";

            // Check for specific error types
            if (error.message) {
                if (error.message.includes("All location methods failed") ||
                    error.message.includes("check your connection")) {

                    errorMsg = "Unable to determine your location. Please check your internet connection or try a different network.";

                    setStatus({
                        type: "error",
                        title: "LOCATION FAILED",
                        msg: errorMsg,
                        icon: <MapPin className="status-icon" />
                    });
                } else if (error.message.includes("permission") || error.message.includes("denied")) {
                    errorMsg = "Location access was denied. I'll try to find you via IP, but if that fails, please enable location in settings.";
                } else if (error.message.includes("Invalid secret") || error.message.includes("Security:")) {
                    errorMsg = "Invalid QR code or product already claimed.";
                } else if (error.message.includes("user rejected") || error.message.includes("User denied")) {
                    errorMsg = "Transaction rejected. Please approve the transaction in MetaMask.";
                } else if (error.reason) {
                    errorMsg = `Transaction failed: ${error.reason}`;
                } else {
                    errorMsg = `Failed to claim: ${error.message}`;
                }
            }

            setStatus({
                type: "error",
                title: "CLAIM FAILED",
                msg: errorMsg,
                icon: <AlertTriangle className="status-icon" />
            });
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const formatLocation = (locString) => {
        if (!locString) return { coords: "Unknown", address: "" };

        // Handle the new format: "lat,lng|City, State, Country"
        if (locString.includes('|')) {
            const [coords, address] = locString.split('|');
            const [lat, lng] = coords.split(',');
            return {
                coords: `${parseFloat(lat).toFixed(4)}°, ${parseFloat(lng).toFixed(4)}°`,
                address: address
            };
        }

        // Handle old format: "lat,lng"
        const [lat, lng] = locString.split(',');
        return {
            coords: `${parseFloat(lat).toFixed(4)}°, ${parseFloat(lng).toFixed(4)}°`,
            address: ""
        };
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "Unknown";
        return new Date(timestamp).toLocaleString();
    };

    return (
        <motion.div
            className="verify-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <header className="verify-header">
                <div className="header-badge">
                    <ShieldCheck size={16} />
                    <span>Customer Verification</span>
                </div>
                <h1>Verify & Claim Product</h1>
                <p>Scan the manufacturer's QR code to verify authenticity and claim ownership</p>
            </header>

            <div className="verify-content">
                {/* Method Selector Tabs */}
                <div className="method-tabs">
                    <button
                        className={`tab-btn ${activeTab === "qr" ? "active" : ""}`}
                        onClick={() => setActiveTab("qr")}
                    >
                        <QrCode size={18} />
                        Scan QR
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "manual" ? "active" : ""}`}
                        onClick={() => setActiveTab("manual")}
                    >
                        <FileText size={18} />
                        Manual Entry
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "qr" ? (
                        /* QR Upload Section */
                        <motion.div
                            key="qr-section"
                            className="qr-upload-section glass"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="upload-icon">
                                <QrCode size={48} />
                            </div>
                            <h3>Upload QR Code</h3>
                            <p>Upload the QR code image hidden inside your product packaging</p>

                            <label className="upload-button">
                                <Upload size={20} />
                                <span>Choose QR Code Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQRUpload}
                                    hidden
                                    disabled={loading}
                                />
                            </label>

                            {loading && activeTab === "qr" && (
                                <div className="loading-indicator">
                                    <div className="spinner"></div>
                                    <p>Scanning QR code...</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* Manual Entry Section */
                        <motion.div
                            key="manual-section"
                            className="manual-entry-section glass"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="upload-icon">
                                <FileText size={48} />
                            </div>
                            <h3>Manual Verification</h3>
                            <p>Enter the Product ID and Secret Key provided by the manufacturer</p>

                            <div className="manual-form">
                                {/* Waybill QR Upload */}
                                <div className="input-field-group">
                                    <label> Upload Waybill QR Code</label>
                                    <div id="qr-reader-hidden" style={{ display: "none" }}></div>
                                    <input type="file" accept="image/*" onChange={handleWaybillUpload} disabled={loading} />
                                </div>
                                <div className="input-field-group">
                                    <label> Consumer Scratch-Off Code</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Secret Key"
                                        value={secretCode}
                                        onChange={(e) => setSecretCode(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleManualVerify}
                                    disabled={loading || !productId || !secretCode}
                                >
                                    {loading ? "Verifying..." : "Verify Asset"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status Display */}
                <AnimatePresence mode="wait">
                    {status.msg && (
                        <motion.div
                            className={`status-card glass ${status.type}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="status-header">
                                {status.icon}
                                <h3>{status.title}</h3>
                            </div>
                            <p>{status.msg}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Product Info & Claim Section */}
                {product && (
                    <motion.div
                        className="product-section glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="product-header">
                            <Package size={32} />
                            <div>
                                <h2>{product.name}</h2>
                                <span className="product-id">ID: #{productId}</span>
                            </div>
                        </div>

                        {product.customerClaim && product.customerClaim.isClaimed ? (
                            /* Already Claimed - Show Owner Info */
                            <div className="claimed-info">
                                <h3>
                                    <CheckCircle2 size={20} />
                                    Ownership Information
                                </h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <User size={16} />
                                        <div>
                                            <label>Owner Name</label>
                                            <p>{product.customerClaim.customerName}</p>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <MapPin size={16} />
                                        <div>
                                            <label>Location</label>
                                            <p className="coords">{formatLocation(product.customerClaim.location).coords}</p>
                                            {formatLocation(product.customerClaim.location).address && (
                                                <p className="address-details">{formatLocation(product.customerClaim.location).address}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Clock size={16} />
                                        <div>
                                            <label>Claimed At</label>
                                            <p>{formatTimestamp(product.customerClaim.timestamp)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Not Claimed - Show Claim Form */
                            <div className="claim-form">
                                <h3>Claim Ownership</h3>
                                <p className="form-description">
                                    Enter your name to claim ownership. Your location will be automatically recorded.
                                </p>

                                {!account ? (
                                    <div className="wallet-notice">
                                        <AlertTriangle size={16} />
                                        <span>Please connect your wallet to claim ownership</span>
                                        <button className="btn btn-primary" onClick={connectWallet}>
                                            Connect Wallet
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="input-field-group">
                                            <label>
                                                <User size={14} />
                                                Your Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter your full name"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="location-notice">
                                            <MapPin size={14} />
                                            <span>Location will be automatically fetched when you claim</span>
                                        </div>

                                        <button
                                            className="btn btn-primary btn-large"
                                            onClick={handleClaimOwnership}
                                            disabled={loading || !customerName.trim()}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="spinner-small"></div>
                                                    <span>Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={20} />
                                                    <span>Claim Ownership</span>
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* View Certificates Button */}
                        {product.history && product.history.length > 0 && (
                            <button
                                className="btn btn-secondary btn-certificates"
                                onClick={() => setShowCertificates(true)}
                            >
                                <FileText size={18} />
                                View Certificates
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Certificate Viewer Modal */}
            {showCertificates && product && (
                <CertificateViewer
                    productHistory={product.history}
                    productId={productId}
                    onClose={() => setShowCertificates(false)}
                />
            )}
        </motion.div>
    );
};

export default VerifyProduct;



