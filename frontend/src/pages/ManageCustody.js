// src/pages/ManageCustody.js
import React, { useState } from "react";
import { useSupplyChain } from "../hooks/useSupplyChain";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import WaybillCertificate from "../components/WaybillCertificate";
import { Truck, Upload, Search, Download, ShieldCheck, MapPin, Camera } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import "./ManageCustody.css";

import { ConnectButton } from "../components/ConnectButton";

const ManageCustody = () => {
    const { account, connectWallet, transferCustody, getProductData, hasRole } = useSupplyChain();
    const [searchParams] = useSearchParams();

    const [productId, setProductId] = useState(searchParams.get('id') || "");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [productDetail, setProductDetail] = useState(null);

    // Handover States
    const [incomingKey, setIncomingKey] = useState(""); // Key from previous owner
    const [nextKey, setNextKey] = useState(""); // Key for next recipient (auto-generated)
    const [location, setLocation] = useState(""); // Current location
    const [isVerified, setIsVerified] = useState(false); // N-1 Integrity Status
    const [recipientEmail, setRecipientEmail] = useState(""); // Email of next recipient
    const [emailSending, setEmailSending] = useState(false); // Email sending state

    // Auto-load product from URL query param (?id=X)
    React.useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (idFromUrl && account) {
            setProductId(idFromUrl);
            // checkProduct is defined below; use a small timeout to let state settle
            setTimeout(() => {
                document.getElementById('custody-search-btn')?.click();
            }, 300);
        }
    }, [account]); // run once wallet is connected

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

    // Send handover key via email to recipient
    const sendHandoverKeyViaEmail = async () => {
        if (!recipientEmail) {
            toast.warn("⚠️ Please enter the recipient's email address");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            toast.error("❌ Invalid email address");
            return;
        }
        setEmailSending(true);
        try {
            const response = await fetch('http://localhost:5000/api/email/send-handover-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientEmail,
                    productId: productDetail.id,
                    productName: productDetail.name,
                    handoverKey: nextKey
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`✅ Handover key sent to ${recipientEmail}`);
            } else {
                toast.error(`❌ Failed to send email: ${data.message}`);
            }
        } catch (error) {
            console.error('Email send error:', error);
            toast.error('❌ Failed to send email. Check your network connection.');
        } finally {
            setEmailSending(false);
        }
    };

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
                    // Auto-fill incomingKey from QR to prevent manual typing errors
                    setIncomingKey(waybillData.handoverKey);
                    // Fetch product data and validate sender
                    const productData = await getProductData(waybillData.productId);
                    const senderMatches = productData.currentOwner.toLowerCase() === waybillData.senderAddress.toLowerCase();

                    setWaybillValid(senderMatches);
                    setProductId(waybillData.productId);
                    setProductDetail(productData);

                    if (senderMatches) {
                        toast.success("✅ Waybill verified! Handover key auto-filled. Enter location and transfer.");
                        setStatus("🛡️ Product Loaded - Key Auto-Filled. Enter Location & Transfer.");
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
        <div className="manage-custody">
            <header className="page-header">
                <h2><Truck className="header-icon" size={48} /> Rolling Supply Chain</h2>
                <p className="subtitle">Dynamic QR Handover Protocol</p>
            </header>

            {!account ? (
                <div className="connect-prompt">
                    <ConnectButton onClick={connectWallet} className="btn-connect pulse" />
                </div>
            ) : (
                <div className="custody-grid">
                    <div className="glass-panel">
                        {/* SEARCH & UPLOAD VIEW */}
                        {!productDetail ? (
                            <div className="search-card-content details-card-inner">
                                <h3><Upload size={24} color="#D4AF37" /> Upload Waybill to Begin</h3>
                                <p className="help-text">
                                    Upload the digital waybill provided by the current custodian to verify asset integrity and start the handover process.
                                </p>

                                <div className="qr-upload-zone">
                                    <label className="dropzone">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleQRWaybillUpload}
                                            style={{ display: 'none' }}
                                            disabled={loading}
                                        />
                                        <div className="dropzone-content">
                                            <div className="upload-icon"><Camera size={56} /></div>
                                            <p>{loading ? "Scanning Secure Protocol..." : "Drop Waybill QR Here"}</p>
                                            <small>Authenticated PNG / JPG Assets Only</small>
                                        </div>
                                    </label>
                                    <div id="qr-reader-hidden" style={{ display: 'none' }}></div>
                                </div>

                                <div className="lookup-section">
                                    <span className="lookup-label">Authorized Lookup</span>
                                    <div className="search-group">
                                        <input
                                            type="number"
                                            className="input-modern"
                                            placeholder="Asset ID Reference"
                                            value={productId}
                                            onChange={(e) => setProductId(e.target.value)}
                                        />
                                        <button id="custody-search-btn" className="btn-search" onClick={() => checkProduct(true)}>
                                            <Search size={22} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* PRODUCT DETAILS VIEW */
                            <div className="details-card-inner">
                                <header className="details-header">
                                    <span className="id-badge">ASSET #{productDetail.id}</span>
                                    <span className="status-pill">{productDetail.state}</span>
                                </header>

                                <div className="details-grid-layout">
                                    {/* PANEL 1: Blockchain Data */}
                                    <div className="details-box">
                                        <div className="data-grid">
                                            <div className="data-item">
                                                <label>Current Custodian</label>
                                                <div className="data-value address-value" style={{ fontSize: '1.25rem' }}>
                                                    {productDetail.currentOwner === account ? "YOU (Active Custodian)" : productDetail.currentOwner.slice(0, 10) + "..." + productDetail.currentOwner.slice(-8)}
                                                </div>
                                            </div>
                                            <div className="data-item">
                                                <label>Asset Description</label>
                                                <div className="data-value" style={{ fontSize: '1.25rem' }}>{productDetail.name}</div>
                                            </div>
                                            <div className="data-item">
                                                <label>Loom Origin</label>
                                                <div className="data-value" style={{ fontSize: '1.1rem' }}>{productDetail.loomLocation || "—"}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PANEL 2: JOURNEY TRACKER */}
                                    {productDetail.history && productDetail.history.length > 0 && (
                                        <div className="details-box journey-section">
                                            <h4><MapPin size={18} /> Verified Chain Custody</h4>
                                            <div className="journey-list">
                                                {productDetail.history.slice().reverse().map((entry, idx) => (
                                                    <div key={idx} className="journey-item">
                                                        <span className="j-actor">{entry.actor.slice(0, 8)}...</span>
                                                        <span className="j-arrow">➔</span>
                                                        <span className="j-loc">
                                                            {entry.location && entry.location.includes('|')
                                                                ? entry.location.split('|')[1]
                                                                : (entry.location || "Initial Hub")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* PANEL 3: ACTIONS (Sender or Receiver) */}
                                    {productDetail.currentOwner === account ? (
                                        <div className="details-box action-box">
                                            <h4>Digital Waybill Terminal</h4>
                                            <p className="instruction-text">Authorize the next handover by downloading this encoded waybill.</p>

                                            <div className="digital-waybill">
                                                <div className="qr-frame">
                                                    {nextKey ? (
                                                        <QRCodeSVG
                                                            id="waybill-qr"
                                                            value={JSON.stringify({
                                                                productId: productDetail.id,
                                                                handoverKey: nextKey,
                                                                senderAddress: account,
                                                                timestamp: Date.now()
                                                            })}
                                                            size={220}
                                                            level="H"
                                                            includeMargin={false}
                                                        />
                                                    ) : (
                                                        <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontSize: '0.85rem', textAlign: 'center', border: '1px dashed rgba(212,175,55,0.3)', borderRadius: 8 }}>
                                                            Generating key...
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="waybill-meta">
                                                    <div className="meta-row">
                                                        <span>Ref ID</span>
                                                        <span>#{productDetail.id}</span>
                                                    </div>
                                                    <div className="meta-row">
                                                        <span>Handover Key</span>
                                                        <span className="key-highlight">{nextKey}</span>
                                                    </div>
                                                </div>

                                                {/* Email recipient input */}
                                                <div style={{ width: '100%', marginTop: '1rem' }}>
                                                    <input
                                                        type="email"
                                                        className="input-modern"
                                                        placeholder="Next Recipient's Email Address"
                                                        value={recipientEmail}
                                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                                        style={{ width: '100%', marginBottom: '0.75rem' }}
                                                    />
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={sendHandoverKeyViaEmail}
                                                        disabled={emailSending || !recipientEmail}
                                                        style={{ width: '100%', height: '48px', marginBottom: '0.75rem', background: 'linear-gradient(135deg, #1a472a, #2d6a4f)', border: '1px solid #52b788', color: '#d8f3dc' }}
                                                    >
                                                        {emailSending ? '📧 Sending...' : '📧 Send Key via Email'}
                                                    </button>
                                                </div>

                                                <button
                                                    className="btn btn-primary btn-download-premium"
                                                    onClick={downloadWaybill}
                                                    disabled={loading}
                                                >
                                                    <Download size={20} /> Secure Download
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="details-box action-box">
                                            <h4>Handover Verification</h4>
                                            <p className="instruction-text">Complete the N-1 Node integrity check to accept custody.</p>

                                            {!scannedWaybill ? (
                                                <div className="qr-upload-zone" style={{ borderStyle: 'solid', borderWidth: '1px', marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <label className="dropzone">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleQRWaybillUpload}
                                                            style={{ display: 'none' }}
                                                            disabled={loading}
                                                        />
                                                        <div className="dropzone-content" style={{ padding: '2rem 1rem' }}>
                                                            <div className="upload-icon" style={{ marginBottom: '1rem' }}><Camera size={40} /></div>
                                                            <p style={{ fontSize: '1rem' }}>Verify Waybill QR</p>
                                                        </div>
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="verification-terminal">
                                                    <WaybillCertificate
                                                        waybill={scannedWaybill}
                                                        isVerified={waybillValid}
                                                        productData={productDetail}
                                                    />

                                                    <div className="custody-input-stack">
                                                        <input
                                                            type="text"
                                                            className="input-modern"
                                                            placeholder="Secret Handover Key"
                                                            value={incomingKey}
                                                            onChange={(e) => setIncomingKey(e.target.value)}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="input-modern"
                                                            placeholder="Dispatch / Target Location"
                                                            value={location}
                                                            onChange={(e) => setLocation(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="btn-stack" style={{ display: 'flex', gap: '1rem' }}>
                                                        <button
                                                            className="btn btn-primary btn-accept"
                                                            onClick={handleTransferCustody}
                                                            disabled={loading || !waybillValid || !location || !incomingKey}
                                                        >
                                                            {loading ? "Authorizing..." : "Accept Custody"}
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ height: '60px', padding: '0 2rem' }}
                                                            onClick={() => {
                                                                setScannedWaybill(null);
                                                                setWaybillValid(false);
                                                                setProductDetail(null);
                                                            }}
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>

                                                    {isVerified && (
                                                        <div className="verification-badge">
                                                            <ShieldCheck size={20} /> Integrity Verified
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

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
