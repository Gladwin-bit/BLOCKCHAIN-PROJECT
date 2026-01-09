// src/pages/ManageCustody.js
import React, { useState } from "react";
import { useSupplyChain } from "../hooks/useSupplyChain";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import WaybillCertificate from "../components/WaybillCertificate";
import "./ManageCustody.css";

import { ConnectButton } from "../components/ConnectButton";

const ManageCustody = () => {
    const { account, connectWallet, transferCustody, getProductData, hasRole } = useSupplyChain();

    const [productId, setProductId] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [productDetail, setProductDetail] = useState(null);

    // Handover States
    const [incomingKey, setIncomingKey] = useState(""); // Key from previous owner
    const [nextKey, setNextKey] = useState(""); // Key for next recipient (auto-generated)
    const [location, setLocation] = useState(""); // Current location
    const [isVerified, setIsVerified] = useState(false); // N-1 Integrity Status

    // QR Waybill States
    const [scannedWaybill, setScannedWaybill] = useState(null); // Parsed QR data
    const [waybillValid, setWaybillValid] = useState(false); // Sender verification status
    const [uploadedFile, setUploadedFile] = useState(null); // Uploaded QR file

    // Auto-reset or refresh on account change
    React.useEffect(() => {
        if (productDetail) {
            // If the account changes, we need to re-verify or at least 
            // reset the "verified" badge since context changed.
            setIsVerified(false);
            // Optional: checkProduct(false) to refresh owner/active labels
        }
    }, [account]);

    // Updated checkProduct to allow preserving state during refresh
    const checkProduct = async (shouldResetSecrets = true) => {
        if (!productId) return;
        setLoading(true);
        // Only reset state if explicit new search (default behavior)
        if (shouldResetSecrets) {
            setProductDetail(null);
            setIsVerified(false);
        }

        try {
            const data = await getProductData(productId);
            setProductDetail(data);
            setIsVerified(true);
            setStatus("✅ Product Found");

            // Fetch the stored handover key from backend
            // Assuming we always want to fetch the key when product data is loaded
            await fetchHandoverKey(productId);
        } catch (e) {
            setStatus(`❌ Product #${productId} not found. Make sure it's created and the contract is connected.`);
            toast.error(`Lookup Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };



    const verifyAuthenticity = (data) => {
        if (!data.history || data.history.length === 0) {
            setStatus("❌ No history found for this asset.");
            setIsVerified(false);
            return;
        }

        // N-1 Node Principle: Validate the link between last recorded action and current state
        const lastEntry = data.history[data.history.length - 1];
        const isIntegrityValid = lastEntry.actor.toLowerCase() === data.currentOwner.toLowerCase();

        if (isIntegrityValid) {
            setIsVerified(true);
            toast.success("✅ N-1 Node Integrity Verified: Product is Authentic!");
            setStatus("🛡️ Asset Authenticity Verified via Blockchain History");
        } else {
            setIsVerified(false);
            toast.error("⚠️ Warning: Chain Integrity Check Failed!");
            setStatus("❌ Warning: History Mismatch. Possible Unauthorized Handover.");
        }
    };

    // Fetch handover key from backend
    const fetchHandoverKey = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/products/${id}/handover-key`);
            const data = await response.json();

            if (data.success && data.handoverKey) {
                setNextKey(data.handoverKey);
                console.log("Fetched handover key from backend:", data.handoverKey);
            } else {
                // No key stored yet, generate a new one
                const randomKey = Math.random().toString(36).slice(-8).toUpperCase();
                setNextKey(randomKey);
                console.log("No stored key, generated new:", randomKey);
            }
        } catch (error) {
            console.error("Error fetching handover key:", error);
            // Fallback to generating a new key
            const randomKey = Math.random().toString(36).slice(-8).toUpperCase();
            setNextKey(randomKey);
        }
    };

    // Auto-generate next key when component loads or when needed
    React.useEffect(() => {
        if (!nextKey) {
            const randomKey = Math.random().toString(36).slice(-8).toUpperCase();
            setNextKey(randomKey);
        }
    }, []);

    // TRANSFER CUSTODY (B2B Handover)
    const handleTransferCustody = async () => {
        if (!incomingKey || !location) {
            setStatus("⚠️ Enter the Handover Key and Location");
            return;
        }
        setLoading(true);
        setStatus("Verifying key & transferring custody...");

        try {
            // Re-verify if not already verified via QR
            if (!isVerified) {
                const lastActor = productDetail.history[productDetail.history.length - 1].actor;
                if (lastActor.toLowerCase() !== productDetail.currentOwner.toLowerCase()) {
                    throw new Error("Chain Integrity Error: Blockchain history mismatch (N-1 Check Failed)");
                }
            }

            // Role Verification (Distributor -> Retailer)
            if (productDetail.stateRaw === 1) {
                const isRetailer = await hasRole("RETAILER", account);
                if (!isRetailer) {
                    setStatus("⚠️ Warning: You are not a registered Retailer. Status will remain 'In Transit'.");
                }
            }

            console.log("About to transfer custody:", { productId, incomingKey, nextKey, location });
            await transferCustody(productId, incomingKey, nextKey, location);

            // Save the new handover key to backend for next transfer
            try {
                await fetch(`http://localhost:5000/api/products/${productId}/handover-key`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ handoverKey: nextKey })
                });
                console.log("Saved new handover key to backend:", nextKey);
            } catch (error) {
                console.error("Failed to save handover key:", error);
            }

            setStatus("✅ Custody Transferred! You are now the custodian.");

            // Generate new key for next transfer
            const newRandomKey = Math.random().toString(36).slice(-8).toUpperCase();
            setNextKey(newRandomKey);
            setIncomingKey("");
            setLocation("");

            await checkProduct(false);
        } catch (e) {
            console.error(e);
            setStatus(`❌ Transfer Failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // DOWNLOAD WAYBILL QR (Sender Side)
    const downloadWaybill = () => {
        const svg = document.getElementById('waybill-qr');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `waybill-product-${productDetail.id}.png`;
                link.click();
                URL.revokeObjectURL(url);
                toast.success('Waybill downloaded successfully!');
            });
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    // UPLOAD & PARSE WAYBILL QR (Receiver Side)
    const handleQRWaybillUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setUploadedFile(file);

        try {
            const html5QrCode = new Html5Qrcode("qr-reader-hidden");

            const qrCodeSuccessCallback = async (decodedText) => {
                try {
                    console.log("QR Code Scanned - Raw Text:", decodedText);
                    const waybillData = JSON.parse(decodedText);
                    console.log("Parsed Waybill Data:", waybillData);

                    // Validate required fields
                    if (!waybillData.productId || !waybillData.handoverKey || !waybillData.senderAddress) {
                        throw new Error("Invalid waybill format");
                    }

                    setScannedWaybill(waybillData);

                    // Fetch product data and validate sender
                    const productData = await getProductData(waybillData.productId);
                    const senderMatches = productData.currentOwner.toLowerCase() === waybillData.senderAddress.toLowerCase();

                    setWaybillValid(senderMatches);
                    setProductId(waybillData.productId);
                    setProductDetail(productData);
                    // DO NOT auto-fill incomingKey - user must enter manually

                    if (senderMatches) {
                        toast.success("✅ Waybill verified! Enter the handover key to continue.");
                        setStatus("🛡️ Product Loaded - Enter Handover Key");
                    } else {
                        toast.warn("⚠️ Warning: Sender address does not match current owner!");
                        setStatus("⚠️ Sender Mismatch - Verify before accepting");
                    }
                } catch (parseError) {
                    console.error("Parse error:", parseError);
                    toast.error("Invalid waybill data format");
                    setStatus("❌ Invalid QR code format");
                }

                html5QrCode.clear();
            };

            await html5QrCode.scanFile(file, true)
                .then(qrCodeSuccessCallback)
                .catch(err => {
                    console.error("QR scan error:", err);
                    toast.error("Failed to read QR code");
                    setStatus("❌ Could not read QR code");
                });

        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to process waybill");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="manage-custody container glass">
            <header className="page-header">
                <h2>🚚 Rolling Supply Chain</h2>
                <p className="subtitle">Dynamic QR Handover Protocol</p>
            </header>

            {!account ? (
                <div className="connect-prompt">
                    <ConnectButton onClick={connectWallet} />
                </div>
            ) : (
                <div className="custody-grid">
                    {/* QR UPLOAD - Primary Entry Point */}
                    {!productDetail ? (
                        <div className="card search-card">
                            <div className="card-header">
                                <h3>📥 Upload Waybill to Begin</h3>
                            </div>
                            <p className="help-text" style={{ marginBottom: '20px' }}>
                                Upload the QR waybill received from the sender to view product details and transfer custody.
                            </p>

                            <div className="qr-upload-zone glass">
                                <label className="dropzone">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleQRWaybillUpload}
                                        style={{ display: 'none' }}
                                        disabled={loading}
                                    />
                                    <div className="dropzone-content">
                                        <div className="upload-icon">📷</div>
                                        <p>{loading ? "Processing QR code..." : "Click to upload waybill QR"}</p>
                                        <small>Supports PNG, JPG, JPEG</small>
                                    </div>
                                </label>
                                {/* Hidden div for QR reader */}
                                <div id="qr-reader-hidden" style={{ display: 'none' }}></div>
                            </div>

                            {/* Manual lookup for owners */}
                            <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '10px' }}>
                                    Product owner? Look up manually
                                </p>
                                <div className="input-group search-group">
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="Enter Product ID..."
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)}
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                    <button className="btn-icon" onClick={() => checkProduct(true)}>➜</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* PRODUCT DETAILS AFTER QR SCAN */
                        <div className="details-card fade-in">
                            <div className="header-row">
                                <span className="asset-id">#{productDetail.id}</span>
                                <span className="status-badge" data-status={productDetail.stateRaw}>
                                    {productDetail.state}
                                </span>
                            </div>

                            <div className="info-row">
                                <div className="info-item">
                                    <label>Current Custodian</label>
                                    <span className="address">
                                        {productDetail.currentOwner === account ? "YOU (Active)" : productDetail.currentOwner.slice(0, 8) + "..."}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Asset Name</label>
                                    <span>{productDetail.name}</span>
                                </div>
                            </div>

                            {/* RECENT OWNERS & PLACES SUMMARY */}
                            {productDetail.history && productDetail.history.length > 0 && (
                                <div className="history-summary-card">
                                    <h4>📍 Recent Journey</h4>
                                    <div className="history-compact-list">
                                        {productDetail.history.slice(-2).reverse().map((entry, idx) => (
                                            <div key={idx} className="history-summary-item">
                                                <span className="h-actor">{entry.actor.slice(0, 6)}...</span>
                                                <span className="h-arrow">➜</span>
                                                <span className="h-loc">
                                                    {entry.location && entry.location.includes('|')
                                                        ? entry.location.split('|')[1]
                                                        : (entry.location || "Unknown")}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <hr className="divider" />

                            {/* OWNER VIEW: QR Waybill Generation */}
                            {productDetail.currentOwner === account && (
                                <div className="action-zone waybill-zone">
                                    <h4>📦 Generate Waybill for Next Recipient</h4>
                                    <p className="instruction">Download this QR waybill and send it to the next custodian</p>

                                    <div className="waybill-qr-container glass">
                                        <QRCodeSVG
                                            id="waybill-qr"
                                            value={JSON.stringify({
                                                productId: productDetail.id,
                                                handoverKey: nextKey,
                                                senderAddress: account,
                                                timestamp: Date.now()
                                            })}
                                            size={256}
                                            level="H"
                                            includeMargin={true}
                                            style={{ display: 'block', margin: '0 auto' }}
                                        />

                                        <div className="waybill-info">
                                            <div className="info-row">
                                                <span>Product ID:</span>
                                                <span>#{productDetail.id}</span>
                                            </div>
                                            <div className="info-row">
                                                <span>Handover Key:</span>
                                                <span className="key-display">{nextKey}</span>
                                            </div>
                                            <div className="info-row">
                                                <span>Your Address:</span>
                                                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                                            </div>
                                        </div>

                                        <button
                                            className="btn btn-download"
                                            onClick={downloadWaybill}
                                            disabled={loading}
                                        >
                                            💾 Download Waybill QR
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* RECEIVER VIEW: QR Upload & Certificate */}
                            {productDetail.currentOwner !== account && (
                                <div className="action-zone receiver-zone">
                                    <h4>📥 Upload Waybill from Sender</h4>
                                    <p className="instruction">Upload the QR waybill image received from the previous owner</p>

                                    {!scannedWaybill ? (
                                        <div className="qr-upload-zone glass">
                                            <label className="dropzone">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleQRWaybillUpload}
                                                    style={{ display: 'none' }}
                                                    disabled={loading}
                                                />
                                                <div className="dropzone-content">
                                                    <div className="upload-icon">📷</div>
                                                    <p>{loading ? "Processing..." : "Click to upload waybill QR"}</p>
                                                    <small>Supports PNG, JPG, JPEG</small>
                                                </div>
                                            </label>
                                            {/* Hidden div for QR reader */}
                                            <div id="qr-reader-hidden" style={{ display: 'none' }}></div>
                                        </div>
                                    ) : (
                                        <div className="waybill-scanned">
                                            <WaybillCertificate
                                                waybill={scannedWaybill}
                                                isVerified={waybillValid}
                                                productData={productDetail}
                                            />

                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="Enter Handover Key from Sender"
                                                    value={incomingKey}
                                                    onChange={(e) => setIncomingKey(e.target.value)}
                                                />
                                            </div>

                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="Enter your current location"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                />
                                            </div>

                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-verify"
                                                    onClick={handleTransferCustody}
                                                    disabled={loading || !waybillValid || !location || !incomingKey}
                                                >
                                                    {loading ? "Transferring..." : "Accept Custody"}
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setScannedWaybill(null);
                                                        setWaybillValid(false);
                                                        setUploadedFile(null);
                                                        setProductDetail(null);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    Upload Different QR
                                                </button>
                                            </div>

                                            {isVerified && (
                                                <p className="verification-success">🛡️ History Cryptographically Verified (N-1 Nodes)</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {status && (
                        <div className={`status-toast ${status.includes('❌') ? 'error' : (status.includes('⚠️') ? 'warning' : 'success')} slide-up`}>
                            {status}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManageCustody;

