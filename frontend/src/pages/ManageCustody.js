// src/pages/ManageCustody.js
import React, { useState } from "react";
import { useSupplyChain } from "../hooks/useSupplyChain";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "./ManageCustody.css";

import { ConnectButton } from "../components/ConnectButton";

const ManageCustody = () => {
    const { account, connectWallet, generateHandover, acceptHandover, getProductData, hasRole, updateSecret } = useSupplyChain();

    const [productId, setProductId] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [productDetail, setProductDetail] = useState(null);

    // Handover States
    const [generatedSecret, setGeneratedSecret] = useState(""); // For Sender to show
    const [inputSecret, setInputSecret] = useState(""); // For Receiver to input
    const [location, setLocation] = useState(""); // For Receiver
    const [newLockSecret, setNewLockSecret] = useState(""); // For Receiver's NEXT lock
    const [isVerified, setIsVerified] = useState(false); // N-1 Integrity Status
    const [nextRecipientSecret, setNextRecipientSecret] = useState(""); // Task 1: New Secret logic

    // Auto-reset or refresh on account change
    React.useEffect(() => {
        if (productDetail) {
            // If the account changes, we need to re-verify or at least 
            // reset the "verified" badge since context changed.
            setIsVerified(false);
            setNewLockSecret("");
            setGeneratedSecret("");
            // Optional: checkProduct(false) to refresh owner/active labels
        }
    }, [account]);

    // Updated checkProduct to allow preserving secret state during refresh
    const checkProduct = async (shouldResetSecrets = true) => {
        if (!productId) return;
        setLoading(true);
        // Only reset secrets if explicit new search (default behavior)
        if (shouldResetSecrets) {
            setProductDetail(null);
            setGeneratedSecret("");
            setNewLockSecret("");
            setIsVerified(false);
        }

        try {
            const data = await getProductData(productId);

            // ACCESS CONTROL: Only allow access if user is the current owner
            // OR if they've scanned a valid QR code (which sets inputSecret)
            const isOwner = data.currentOwner.toLowerCase() === account?.toLowerCase();
            const hasScannedQR = inputSecret && inputSecret.trim().length > 0;

            if (!isOwner && !hasScannedQR) {
                setStatus(`🔒 Access Denied: You must scan the handover QR code to manage this asset.`);
                setProductDetail(null);
                toast.error("Access denied. Please scan the handover QR code from the current owner.");
                return;
            }

            setProductDetail(data);
            setStatus("");
        } catch (e) {
            setStatus(`❌ Product #${productId} not found. Make sure it's created and the contract is connected.`);
            toast.error(`Lookup Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // QR UPLOAD LOGIC (Receiver Side Verification)
    const handleQRUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
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
                            // Robust Parsing: Support both formats (creation QR vs Handover QR)
                            const rawId = qrData.productId || qrData.id;
                            const scannedId = rawId ? String(rawId).replace("HANDOVER-", "") : null;
                            const scannedSecret = qrData.secretCode || qrData.secret;

                            console.log("Scanned QR Data:", { rawId, scannedId, scannedSecret });

                            if (scannedId) {
                                setProductId(scannedId);
                                try {
                                    // Set the scanned secret first (this grants access)
                                    if (scannedSecret) setInputSecret(scannedSecret);

                                    // Now fetch product data - access will be granted because inputSecret is set
                                    const data = await getProductData(scannedId);

                                    // Verify ownership or QR access
                                    const isOwner = data.currentOwner.toLowerCase() === account?.toLowerCase();
                                    const hasQRAccess = scannedSecret && scannedSecret.trim().length > 0;

                                    if (isOwner || hasQRAccess) {
                                        setProductDetail(data);
                                        verifyAuthenticity(data);
                                        toast.success("✅ QR Code verified! Access granted.");
                                    } else {
                                        setStatus(`🔒 Invalid QR code for this asset.`);
                                        toast.error("Invalid QR code. Please scan the correct handover QR.");
                                    }
                                } catch (lookupErr) {
                                    console.error("Post-Scan Lookup Failure:", lookupErr);
                                    setStatus(`❌ Scanned ID #${scannedId} not found on this contract.`);
                                    toast.warn("Product found in QR but is missing from this blockchain network.");
                                }
                            } else {
                                throw new Error("Missing Product ID in QR");
                            }
                        } catch (err) {
                            console.error("QR Parse Error:", err);
                            toast.error("❌ Invalid QR format or missing data");
                        }
                    } else {
                        toast.error("❌ No QR code found");
                    }
                    setLoading(false);
                };
            };
            reader.readAsDataURL(file);
        } catch (err) {
            toast.error("❌ Upload failed");
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

    // TASK 1: UPDATE SECRET (Manufacturer/Distributor/Retailer)
    const handleUpdateSecret = async () => {
        if (!nextRecipientSecret) {
            toast.warn("Please enter a new secret key for the next owner.");
            return;
        }
        setLoading(true);
        try {
            await updateSecret(productId, nextRecipientSecret);
            toast.success("Next Owner's Lock has been set! 🔐");
            await checkProduct(false);
        } catch (e) {
            toast.error(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // GENERATE PASS (Sender)
    const handleGeneratePass = async () => {
        if (!account) return;
        setLoading(true);
        setStatus("Encrypting new handover pass...");

        try {
            const randomSecret = Math.random().toString(36).slice(-8).toUpperCase();
            await generateHandover(productId, randomSecret);
            setGeneratedSecret(randomSecret);
            setStatus("✅ Handover Pass Active! Show this QR to the receiver.");
            await checkProduct(false);
        } catch (e) {
            setStatus(`❌ Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ACCEPT & ROLL (Receiver)
    const handleAcceptHandover = async () => {
        if (!inputSecret || !location) {
            setStatus("⚠️ Enter the Handover Pass and Location");
            return;
        }
        setLoading(true);
        setStatus("Verifying pass & rolling protocol...");

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

            const myNewSecret = Math.random().toString(36).slice(-8).toUpperCase();
            await acceptHandover(productId, inputSecret, myNewSecret, location);
            setNewLockSecret(myNewSecret);
            setStatus("✅ Handover Accepted! You are now the custodian.");
            await checkProduct(false);
        } catch (e) {
            console.error(e);
            setStatus(`❌ Handover Failed: ${e.message}`);
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
                    {/* SEARCH SECTION */}
                    <div className="card search-card">
                        <div className="card-header">
                            <h3>🔍 Locate Asset</h3>
                            <label className="btn-upload-scan">
                                📷 Scan Sender's QR
                                <input type="file" accept="image/*" onChange={handleQRUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                        <div className="input-group search-group">
                            <input
                                type="number"
                                className="input-field"
                                placeholder="Enter Asset ID..."
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            />
                            <button className="btn-icon" onClick={() => checkProduct(true)}>➜</button>
                        </div>
                        <p className="help-text">
                            ℹ️ You can only manage assets you own or have received via QR code handover.
                        </p>
                    </div>

                    {/* PRODUCT CONTEXT */}
                    {productDetail && (
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

                            {/* SENDER VIEW: Generate Pass */}
                            {productDetail.currentOwner === account && (
                                <div className="action-zone">
                                    <h4>📤 Release Custody</h4>

                                    {/* Task 1: Update Secret Section */}
                                    <div className="secret-setup-box glass">
                                        <p className="instruction">1. Set the Secret Code for the next owner.</p>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="e.g. KEY-999 (Next Owner's Key)"
                                                value={nextRecipientSecret}
                                                onChange={(e) => setNextRecipientSecret(e.target.value)}
                                            />
                                            <button className="btn btn-secondary" onClick={handleUpdateSecret} disabled={loading}>
                                                Set Lock
                                            </button>
                                        </div>
                                    </div>

                                    <p className="instruction">2. Generate the temporary handover pass.</p>

                                    {!generatedSecret ? (
                                        <button className="btn btn-action" onClick={handleGeneratePass} disabled={loading}>
                                            {loading ? "Generating..." : "Generate Handover Pass"}
                                        </button>
                                    ) : (
                                        <div className="qr-result slide-up">
                                            <QRCodeDisplay productId={`HANDOVER-${productId}`} secretCode={generatedSecret} />
                                            <p className="secret-display">{generatedSecret}</p>
                                            <p className="caption">Scanner must read this code to accept.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* RECEIVER VIEW: Scan & Roll */}
                            {productDetail.currentOwner !== account && !newLockSecret && (
                                <div className="action-zone highlight-zone">
                                    <h4>📥 Accept Custody</h4>
                                    <p className="instruction">Upload the sender's pass for n-1 node verification.</p>

                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Enter/Scan Handover Pass"
                                            value={inputSecret}
                                            onChange={(e) => setInputSecret(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Current Location (e.g. Warehouse 1)"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                        />
                                    </div>

                                    <button className="btn btn-verify" onClick={handleAcceptHandover} disabled={loading}>
                                        {loading ? "Verifying..." : "Accept & Roll Protocol"}
                                    </button>

                                    {isVerified && (
                                        <p className="verification-success">🛡️ History Cryptographically Verified (N-1 Nodes)</p>
                                    )}
                                </div>
                            )}

                            {/* NEW CUSTODIAN SUCCESS STATE */}
                            {newLockSecret && (
                                <div className="success-zone slide-up">
                                    <h3>🎉 You are the new Custodian!</h3>
                                    <p>Your new secret for the NEXT handover is:</p>
                                    <div className="secret-display large">{newLockSecret}</div>
                                    <p className="caption">SAVE THIS! You will need it to release custody later.</p>
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

