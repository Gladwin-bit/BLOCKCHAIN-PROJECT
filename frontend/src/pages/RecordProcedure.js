// src/pages/RecordProcedure.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSupplyChain } from "../hooks/useSupplyChain";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { generateShortSecretCode } from "../utils/secretCodeGenerator";
import { ethers } from "ethers";
import "./RecordProcedure.css";
import { ConnectButton } from "../components/ConnectButton";

// ── Tabs definition ─────────────────────────────────────────────────
const TABS = [
    { id: 0, label: "Basic Info", icon: "📋", desc: "Saree name, loom & date" },
    { id: 1, label: "Materials", icon: "🧵", desc: "Threads, dyes & vendors" },
    { id: 2, label: "Keys & Cert", icon: "🔐", desc: "Secret codes & certificate" },
];

const RecordProcedure = () => {
    const { account, createProduct } = useSupplyChain();

    // Form State
    const [name, setName] = useState("");
    const [loomLocation, setLoomLocation] = useState("");
    const [weaveDate, setWeaveDate] = useState("");
    const [consumerSecret, setConsumerSecret] = useState("");
    const [handoverKey, setHandoverKey] = useState("");
    const [certificateFile, setCertificateFile] = useState(null);
    const [firstRecipientEmail, setFirstRecipientEmail] = useState(""); // Email for initial handover key

    // Material Details State
    const [threads, setThreads] = useState([{ supplier: "", type: "", colors: "", quantity: "", batchNumber: "" }]);
    const [dyes, setDyes] = useState([{ supplier: "", colorCode: "", colorName: "", batchNumber: "", type: "" }]);
    const [fabricSources, setFabricSources] = useState([{ vendor: "", material: "", quantity: "" }]);
    const [materialNotes, setMaterialNotes] = useState("");

    // UI State
    const [activeTab, setActiveTab] = useState(0);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [createdProduct, setCreatedProduct] = useState(null);

    // Auto-generate keys on mount
    React.useEffect(() => {
        if (!consumerSecret) setConsumerSecret(generateShortSecretCode("SAREE", "SCRATCH"));
        if (!handoverKey) setHandoverKey(generateShortSecretCode("HANDOVER", "B2B"));
    }, [consumerSecret, handoverKey]);

    // ── Material helpers ──────────────────────────────────────────
    const addThread = () => setThreads([...threads, { supplier: "", type: "", colors: "", quantity: "", batchNumber: "" }]);
    const removeThread = (i) => setThreads(threads.filter((_, idx) => idx !== i));
    const updateThread = (i, f, v) => { const u = [...threads]; u[i][f] = v; setThreads(u); };

    const addDye = () => setDyes([...dyes, { supplier: "", colorCode: "", colorName: "", batchNumber: "", type: "" }]);
    const removeDye = (i) => setDyes(dyes.filter((_, idx) => idx !== i));
    const updateDye = (i, f, v) => { const u = [...dyes]; u[i][f] = v; setDyes(u); };

    const addFabricSource = () => setFabricSources([...fabricSources, { vendor: "", material: "", quantity: "" }]);
    const removeFabricSource = (i) => setFabricSources(fabricSources.filter((_, idx) => idx !== i));
    const updateFabricSource = (i, f, v) => { const u = [...fabricSources]; u[i][f] = v; setFabricSources(u); };

    // ── Submit ──────────────────────────────────────────────────
    const handleRecord = async () => {
        if (!account) { setStatus("⚠️ Connect wallet first"); return; }
        if (!name || !loomLocation || !weaveDate) { setStatus("⚠️ Complete all Basic Info fields"); setActiveTab(0); return; }
        if (!certificateFile) { setStatus("⚠️ Upload a product certificate"); setActiveTab(2); return; }

        setLoading(true); setStatus(""); setCreatedProduct(null);
        try {
            setStatus("📤 Uploading certificate...");
            const formData = new FormData();
            formData.append("certificate", certificateFile);
            const uploadRes = await fetch("http://localhost:5000/api/products/upload-certificate", { method: "POST", body: formData });
            const uploadData = await uploadRes.json();
            if (!uploadData.success) throw new Error("Certificate upload failed");

            const certFilename = uploadData.filename;

            setStatus("⛓️ Creating product on blockchain...");
            const consumerSecretHash = ethers.keccak256(ethers.toUtf8Bytes(consumerSecret));
            const handoverKeyHash = ethers.keccak256(ethers.toUtf8Bytes(handoverKey));
            const weaveDateTimestamp = Math.floor(new Date(weaveDate).getTime() / 1000);
            const result = await createProduct(name, loomLocation, weaveDateTimestamp, consumerSecretHash, handoverKeyHash);
            const productId = result?.productId;

            setStatus("💾 Saving to database...");
            await fetch("http://localhost:5000/api/products/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    name,
                    loomLocation,
                    weaveDate,
                    manufacturerAddress: account,
                    consumerSecretHash,
                    currentHandoverKey: handoverKey,
                    certificateFilename: certFilename,
                    txHash: result?.txHash || ""
                })
            });

            // Upload materials metadata
            if (threads[0].supplier || dyes[0].supplier || fabricSources[0].vendor) {
                await fetch("http://localhost:5000/api/products/upload-materials-metadata", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productName: name, materials: { threads, dyes, fabricSources, notes: materialNotes } })
                });
            }

            setStatus("✅ Saree registered on blockchain!");
            setCreatedProduct({ id: productId, consumerSecret, handoverKey });

            // Send initial handover key via email if provided
            if (firstRecipientEmail) {
                try {
                    setStatus("📧 Sending handover key to recipient...");
                    const emailRes = await fetch('http://localhost:5000/api/email/send-handover-key', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipientEmail: firstRecipientEmail,
                            productId,
                            productName: name,
                            handoverKey
                        })
                    });
                    const emailData = await emailRes.json();
                    if (emailData.success) {
                        setStatus(`✅ Saree registered! Handover key emailed to ${firstRecipientEmail}`);
                    } else {
                        setStatus(`✅ Saree registered! (Email failed: ${emailData.message})`);
                    }
                } catch (emailErr) {
                    console.error('Email error:', emailErr);
                    setStatus(`✅ Saree registered! (Could not send email)`);
                }
            }

            // Reset form
            setName(""); setLoomLocation(""); setWeaveDate(""); setCertificateFile(null);
            setFirstRecipientEmail("");
            setThreads([{ supplier: "", type: "", colors: "", quantity: "", batchNumber: "" }]);
            setDyes([{ supplier: "", colorCode: "", colorName: "", batchNumber: "", type: "" }]);
            setFabricSources([{ vendor: "", material: "", quantity: "" }]);
            setMaterialNotes("");
            setConsumerSecret(""); setHandoverKey("");
        } catch (e) {
            console.error(e);
            setStatus(`❌ Error: ${e.message || "Failed to register Saree"}`);
        } finally {
            setLoading(false);
        }
    };

    // ── Tab content ─────────────────────────────────────────────
    const tabContent = {
        // ── TAB 0: Basic Info ──
        0: (
            <div className="tab-fields">
                <div className="rp-field">
                    <label>Saree Name / ID</label>
                    <input
                        type="text"
                        placeholder="e.g. Kasaragod Cotton — Batch 105"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className="rp-row">
                    <div className="rp-field">
                        <label>Loom Location</label>
                        <input
                            type="text"
                            placeholder="e.g. Weaving Center A, Loom 4"
                            value={loomLocation}
                            onChange={e => setLoomLocation(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="rp-field">
                        <label>Date of Weaving</label>
                        <input
                            type="date"
                            value={weaveDate}
                            onChange={e => setWeaveDate(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="tab-nav-row">
                    <span />
                    <button className="btn btn-primary" onClick={() => setActiveTab(1)} disabled={!name || !loomLocation || !weaveDate}>
                        Next: Materials →
                    </button>
                </div>
            </div>
        ),

        // ── TAB 1: Materials ──
        1: (
            <div className="tab-fields">
                {/* Threads */}
                <div className="mat-group">
                    <div className="mat-group-hd">
                        <span>🧵 Thread Suppliers</span>
                        <button className="mat-add-btn" onClick={addThread} disabled={loading}>+ Add</button>
                    </div>
                    {threads.map((t, i) => (
                        <div key={i} className="mat-entry">
                            <input placeholder="Supplier" value={t.supplier} onChange={e => updateThread(i, "supplier", e.target.value)} disabled={loading} />
                            <input placeholder="Type" value={t.type} onChange={e => updateThread(i, "type", e.target.value)} disabled={loading} />
                            <input placeholder="Colours" value={t.colors} onChange={e => updateThread(i, "colors", e.target.value)} disabled={loading} />
                            <input placeholder="Qty" value={t.quantity} onChange={e => updateThread(i, "quantity", e.target.value)} disabled={loading} />
                            <input placeholder="Batch #" value={t.batchNumber} onChange={e => updateThread(i, "batchNumber", e.target.value)} disabled={loading} />
                            {threads.length > 1 && <button className="mat-rm-btn" onClick={() => removeThread(i)}>✕</button>}
                        </div>
                    ))}
                </div>

                {/* Dyes */}
                <div className="mat-group">
                    <div className="mat-group-hd">
                        <span>🎨 Dye Suppliers</span>
                        <button className="mat-add-btn" onClick={addDye} disabled={loading}>+ Add</button>
                    </div>
                    {dyes.map((d, i) => (
                        <div key={i} className="mat-entry">
                            <input placeholder="Supplier" value={d.supplier} onChange={e => updateDye(i, "supplier", e.target.value)} disabled={loading} />
                            <input placeholder="Color code" value={d.colorCode} onChange={e => updateDye(i, "colorCode", e.target.value)} disabled={loading} />
                            <input placeholder="Color name" value={d.colorName} onChange={e => updateDye(i, "colorName", e.target.value)} disabled={loading} />
                            <input placeholder="Batch #" value={d.batchNumber} onChange={e => updateDye(i, "batchNumber", e.target.value)} disabled={loading} />
                            <input placeholder="Type" value={d.type} onChange={e => updateDye(i, "type", e.target.value)} disabled={loading} />
                            {dyes.length > 1 && <button className="mat-rm-btn" onClick={() => removeDye(i)}>✕</button>}
                        </div>
                    ))}
                </div>

                {/* Fabric Vendors */}
                <div className="mat-group">
                    <div className="mat-group-hd">
                        <span>🏭 Fabric & Material Vendors</span>
                        <button className="mat-add-btn" onClick={addFabricSource} disabled={loading}>+ Add</button>
                    </div>
                    {fabricSources.map((f, i) => (
                        <div key={i} className="mat-entry mat-entry--short">
                            <input placeholder="Vendor" value={f.vendor} onChange={e => updateFabricSource(i, "vendor", e.target.value)} disabled={loading} />
                            <input placeholder="Material" value={f.material} onChange={e => updateFabricSource(i, "material", e.target.value)} disabled={loading} />
                            <input placeholder="Qty" value={f.quantity} onChange={e => updateFabricSource(i, "quantity", e.target.value)} disabled={loading} />
                            {fabricSources.length > 1 && <button className="mat-rm-btn" onClick={() => removeFabricSource(i)}>✕</button>}
                        </div>
                    ))}
                </div>

                {/* Notes */}
                <div className="rp-field">
                    <label>📝 Additional Notes</label>
                    <textarea
                        placeholder="Any additional information about materials, techniques, or processes..."
                        value={materialNotes}
                        onChange={e => setMaterialNotes(e.target.value)}
                        disabled={loading}
                        rows={3}
                    />
                </div>

                <div className="tab-nav-row">
                    <button className="btn btn-secondary" onClick={() => setActiveTab(0)}>← Back</button>
                    <button className="btn btn-primary" onClick={() => setActiveTab(2)}>Next: Keys & Cert →</button>
                </div>
            </div>
        ),

        // ── TAB 2: Keys & Certificate ──
        2: (
            <div className="tab-fields">
                <div className="rp-field">
                    <label>
                        🎫 Consumer Scratch-Off Code
                        <small>Print this on a hidden scratch label — never changes</small>
                    </label>
                    <input type="text" value={consumerSecret} readOnly className="rp-readonly secret-input" />
                </div>

                <div className="rp-field">
                    <label>
                        🔑 First Handover Key
                        <small>Share with Cooperative / Distributor at first custody transfer</small>
                    </label>
                    <input type="text" value={handoverKey} readOnly className="rp-readonly key-input" />
                </div>

                <div className="rp-field">
                    <label>
                        📧 First Recipient's Email
                        <small>The handover key will be automatically sent to this email after registration</small>
                    </label>
                    <input
                        type="email"
                        placeholder="e.g. distributor@example.com (optional)"
                        value={firstRecipientEmail}
                        onChange={e => setFirstRecipientEmail(e.target.value)}
                        disabled={loading}
                        style={{ background: 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.3)' }}
                    />
                </div>

                <div className="rp-field">
                    <label>📎 Asset Image / Certificate</label>
                    <div className="file-drop-zone" onClick={() => document.getElementById("cert-upload").click()}>
                        {certificateFile ? (
                            <span className="file-chosen">✓ {certificateFile.name}</span>
                        ) : (
                            <>
                                <span className="file-icon">📄</span>
                                <span>Click to upload PDF / PNG / JPG</span>
                                <small>Max 5 MB</small>
                            </>
                        )}
                    </div>
                    <input
                        id="cert-upload"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: "none" }}
                        onChange={e => setCertificateFile(e.target.files[0])}
                        disabled={loading}
                    />
                </div>

                {status && (
                    <div className={`rp-status ${status.startsWith("✅") ? "rp-status--ok" : status.startsWith("❌") ? "rp-status--err" : "rp-status--info"}`}>
                        {status}
                    </div>
                )}

                <div className="tab-nav-row">
                    <button className="btn btn-secondary" onClick={() => setActiveTab(1)} disabled={loading}>← Back</button>
                    <button className="btn btn-primary register-btn" onClick={handleRecord} disabled={loading || !certificateFile}>
                        {loading ? "Registering…" : "⛓️ Register Saree"}
                    </button>
                </div>
            </div>
        ),
    };

    return (
        <div className="rp-page">

            {/* ── Page Header ─────────────────────────── */}
            <div className="rp-hero">
                <div className="rp-hero-inner">
                    <span className="rp-badge">KASARAGOD WEAVERS</span>
                    <h1 className="rp-title">Saree Registry</h1>
                    <p className="rp-sub">Digitally certify authentic handloom sarees on the blockchain</p>
                </div>
            </div>

            <div className="rp-body">
                {!account ? (
                    <div className="rp-connect glass">
                        <span>🔌</span>
                        <p>Connect your MetaMask wallet to access the registry</p>
                        <ConnectButton onClick={() => { }} />
                    </div>
                ) : (
                    <div className="rp-card glass">

                        {/* ── Tab Bar ─────────────────────────── */}
                        <div className="rp-tabs">
                            {TABS.map((tab, i) => (
                                <button
                                    key={tab.id}
                                    className={`rp-tab ${activeTab === tab.id ? "rp-tab--active" : ""} ${i < activeTab ? "rp-tab--done" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    disabled={loading}
                                >
                                    <span className="rp-tab-num">
                                        {i < activeTab ? "✓" : tab.id + 1}
                                    </span>
                                    <span className="rp-tab-icon">{tab.icon}</span>
                                    <div className="rp-tab-text">
                                        <span className="rp-tab-label">{tab.label}</span>
                                        <span className="rp-tab-desc">{tab.desc}</span>
                                    </div>
                                    {i < TABS.length - 1 && <span className="rp-tab-arrow">›</span>}
                                </button>
                            ))}
                        </div>

                        {/* ── Progress Bar ────────────────────── */}
                        <div className="rp-progress-track">
                            <div className="rp-progress-fill" style={{ width: `${((activeTab + 1) / TABS.length) * 100}%` }} />
                        </div>

                        {/* ── Tab Content ─────────────────────── */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className="rp-tab-content"
                            >
                                {tabContent[activeTab]}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Success Overlay ─────────────────────── */}
            <AnimatePresence>
                {createdProduct && (
                    <motion.div className="rp-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="rp-result-card glass">
                            <button className="rp-overlay-close" onClick={() => setCreatedProduct(null)}>×</button>
                            <h3>✅ Saree Registered!</h3>
                            <QRCodeDisplay productId={createdProduct.id} secretCode={createdProduct.consumerSecret} />
                            <div className="rp-result-codes">
                                <div className="code-box">
                                    <p>CONSUMER SCRATCH CODE</p>
                                    <code>{createdProduct.consumerSecret}</code>
                                </div>
                                <div className="code-box key-box">
                                    <p>HANDOVER KEY</p>
                                    <code>{createdProduct.handoverKey}</code>
                                </div>
                            </div>
                            <div className="rp-result-actions">
                                <Link to={`/custody?id=${createdProduct.id}`} className="btn btn-primary" style={{ width: "100%", textAlign: "center", marginTop: "0.25rem" }}>
                                    📤 Generate Waybill →
                                </Link>
                                <Link to="/" className="btn btn-secondary" style={{ width: "100%", textAlign: "center" }}>
                                    ← Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RecordProcedure;
