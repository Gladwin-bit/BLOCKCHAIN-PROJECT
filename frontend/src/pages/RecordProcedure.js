// src/pages/RecordProcedure.js
import React, { useState } from "react";
import { useSupplyChain } from "../hooks/useSupplyChain";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { generateShortSecretCode } from "../utils/secretCodeGenerator";
import { ethers } from "ethers";
import "./RecordProcedure.css";

import { ConnectButton } from "../components/ConnectButton";

const RecordProcedure = () => {
    const { account, connectWallet, createProduct } = useSupplyChain();
    const [activeTab, setActiveTab] = useState("single"); // "single" or "bulk"

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [certificateFile, setCertificateFile] = useState(null);

    // UI State
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [createdProduct, setCreatedProduct] = useState(null);
    const [batchResults, setBatchResults] = useState([]);

    const handleBatchUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const products = Array.isArray(data) ? data : [data];

                setLoading(true);
                setStatus(`⏳ Processing batch of ${products.length} assets...`);
                setBatchResults([]);

                const results = [];
                for (const prod of products) {
                    const secret = prod.secret || prod.secretCode || generateShortSecretCode(prod.product || prod.name, "BATCH");
                    const id = await createProduct(prod.product || prod.name, secret);
                    results.push({ id, name: prod.product || prod.name, secretCode: secret });
                }

                setBatchResults(results);
                setStatus(`✅ Batch complete! Registered ${results.length} assets.`);
            } catch (err) {
                console.error(err);
                setStatus("❌ Error parsing batch file. Ensure it's valid JSON.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleRecord = async () => {
        if (!account) {
            setStatus("⚠️ Connect wallet first");
            return;
        }
        if (!name) {
            setStatus("⚠️ Please enter a product name");
            return;
        }
        if (!certificateFile) {
            setStatus("⚠️ Please upload a product certificate");
            return;
        }

        setLoading(true);
        setStatus("");
        setCreatedProduct(null);

        try {
            // Step 1: Upload certificate to backend
            setStatus("📤 Uploading certificate...");
            const formData = new FormData();
            formData.append('certificate', certificateFile);

            const uploadResponse = await fetch('http://localhost:5000/api/products/upload-certificate', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                throw new Error(uploadResult.message || 'Failed to upload certificate');
            }

            const certificateFilename = uploadResult.filename;
            const certificatePath = uploadResult.path;
            console.log('Certificate uploaded:', certificateFilename);

            // Step 2: Create product on blockchain with certificate filename
            setStatus("⛓️ Creating product on blockchain...");
            const finalSecret = secretCode || generateShortSecretCode(name, "PROD");
            const secretHash = ethers.keccak256(ethers.toUtf8Bytes(finalSecret));
            const productId = await createProduct(name, finalSecret, certificateFilename);

            // Step 3: Save to database for backup and querying
            setStatus("💾 Saving to database...");
            try {
                const dbResponse = await fetch('http://localhost:5000/api/products/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId,
                        name,
                        manufacturerAddress: account,
                        secretHash,
                        certificateFilename,
                        certificatePath
                    })
                });

                const dbResult = await dbResponse.json();
                if (dbResult.success) {
                    console.log('Product saved to database');
                } else {
                    console.warn('Database save failed:', dbResult.message);
                }
            } catch (dbError) {
                console.warn('Database save error (non-critical):', dbError);
            }

            setStatus(`✅ Product #${productId} registered successfully!`);
            setCreatedProduct({
                id: productId,
                name: name,
                secretCode: finalSecret
            });

            // Reset form
            setName("");
            setDescription("");
            setSecretCode("");
            setCertificateFile(null);
        } catch (e) {
            console.error(e);
            setStatus(`❌ Error: ${e.message || "Failed to register product"}`);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <motion.div
            className="record-procedure-page container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.header className="page-header" variants={itemVariants}>
                <div className="premium-badge">FORGE PROTOCOL</div>
                <h1>Asset Registration</h1>
                <p className="subtitle">
                    Establish immutable blockchain provenance for high-value luxury items.
                </p>
            </motion.header>

            {!account ? (
                <motion.div className="connect-view glass" variants={itemVariants}>
                    <ConnectButton onClick={connectWallet} />
                    <p>Authorize session to access the registration forge.</p>
                </motion.div>
            ) : (
                <div className="forge-container">
                    {/* Tabs Navigation */}
                    <div className="forge-tabs">
                        <button
                            className={`tab-btn ${activeTab === "single" ? "active" : ""}`}
                            onClick={() => setActiveTab("single")}
                        >
                            <span className="tab-icon">💎</span>
                            <span className="tab-label">Single Asset</span>
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "bulk" ? "active" : ""}`}
                            onClick={() => setActiveTab("bulk")}
                        >
                            <span className="tab-icon">📦</span>
                            <span className="tab-label">Bulk Registry</span>
                        </button>
                    </div>

                    <motion.div
                        className="forge-content glass"
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === "single" ? (
                            <div className="single-forge">
                                <div className="input-field">
                                    <label>Asset Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter luxury asset name..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="input-field">
                                    <label>Heritage & Specifications</label>
                                    <textarea
                                        placeholder="Detail the craftsmanship, materials, and serial numbers..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="input-field">
                                    <label>
                                        Secret Verification Pin
                                        <small>(Auto-generated if left empty)</small>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Private code for ownership transfer"
                                        value={secretCode}
                                        onChange={(e) => setSecretCode(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="input-field">
                                    <label>
                                        Product Certificate / Warranty Document
                                        <small>(Required - PDF or Image, max 5MB)</small>
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={(e) => setCertificateFile(e.target.files[0])}
                                        disabled={loading}
                                        style={{
                                            padding: '10px',
                                            border: '2px dashed #666',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {certificateFile && (
                                        <small style={{ color: '#4CAF50', marginTop: '5px', display: 'block' }}>
                                            ✓ Selected: {certificateFile.name}
                                        </small>
                                    )}
                                </div>
                                <button
                                    className="btn-forge-action primary"
                                    onClick={handleRecord}
                                    disabled={loading}
                                >
                                    {loading ? "Forging Identity..." : "Forge Asset Identity"}
                                </button>
                            </div>
                        ) : (
                            <div className="bulk-forge">
                                <div className="bulk-info">
                                    <h3>Enterprise Batch Processing</h3>
                                    <p>Upload a JSON manifest to register multiple assets in a single sequence.</p>
                                </div>
                                <label className={`bulk-upload-zone ${loading ? 'disabled' : ''}`}>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleBatchUpload}
                                        hidden
                                        disabled={loading}
                                    />
                                    <div className="upload-content">
                                        <span className="upload-icon">📂</span>
                                        <span className="upload-text">
                                            {loading ? "Processing Manifest..." : "Click to select JSON Manifest"}
                                        </span>
                                    </div>
                                </label>

                                {batchResults.length > 0 && (
                                    <div className="batch-manifest-results">
                                        <h4>Manifest Processed Successfully</h4>
                                        <div className="results-grid">
                                            {batchResults.map((res, i) => (
                                                <div key={i} className="result-card">
                                                    <span className="res-id">#{res.id}</span>
                                                    <span className="res-name">{res.name}</span>
                                                    <code className="res-code">{res.secretCode}</code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            <AnimatePresence>
                {status && (
                    <motion.div
                        className={`forge-status ${status.includes('✅') ? 'success' : 'info'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {status}
                    </motion.div>
                )}
            </AnimatePresence>

            {createdProduct && (
                <motion.div
                    className="forge-result-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="forge-result-card glass">
                        <button className="close-result" onClick={() => setCreatedProduct(null)}>×</button>
                        <h3>Asset Forged Successfully</h3>
                        <QRCodeDisplay
                            productId={createdProduct.id}
                            secretCode={createdProduct.secretCode}
                        />
                        <div className="result-details">
                            <p><strong>Asset ID:</strong> {createdProduct.id}</p>
                            <p><strong>Secret Code:</strong> <code>{createdProduct.secretCode}</code></p>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default RecordProcedure;
