// src/pages/TraceProduct.js
import React, { useState } from "react";
import { useSupplyChain } from "../hooks/useSupplyChain";
import ProductTimeline from "../components/ProductTimeline";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { motion } from "framer-motion";
import "./TraceProduct.css";

const TraceProduct = () => {
    const { account, connectWallet, getProductData } = useSupplyChain();
    const [productId, setProductId] = useState("");
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleTrace = async () => {
        if (!account) {
            setError("🔒 Connect wallet to access blockchain data");
            return;
        }
        if (!productId) {
            setError("⚠️ Please enter a valid Asset ID");
            return;
        }

        setLoading(true);
        setError("");
        setProduct(null);

        try {
            const productData = await getProductData(productId);
            setProduct(productData);
        } catch (e) {
            console.error(e);
            if (e.message.includes("Item not found")) {
                setError(`❌ Asset #${productId} does not exist on the current ledger.`);
            } else {
                setError(`⚠️ Error: ${e.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trace-product-page container glass">
            <header className="page-header">
                <h1>🔍 Trace Asset Journey</h1>
                <p className="subtitle">Immutable Blockchain Audit Trail</p>
            </header>

            {!account ? (
                <div className="connect-prompt">
                    <button className="btn btn-connect pulse" onClick={connectWallet}>
                        Connect MetaMask to Trace
                    </button>
                </div>
            ) : (
                <div className="trace-content">
                    {/* Search Section */}
                    <div className="card search-card">
                        <div className="input-group search-group">
                            <input
                                type="number"
                                className="input-field"
                                placeholder="Enter Asset ID..."
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleTrace()}
                                disabled={loading}
                            />
                            <button
                                className="btn-icon"
                                onClick={handleTrace}
                                disabled={loading}
                            >
                                {loading ? "⏳" : "➜"}
                            </button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <motion.div
                            className="status-toast error slide-up"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Product Details */}
                    {product && !loading && (
                        <motion.div
                            className="details-card fade-in"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="header-row">
                                <span className="asset-id">#{product.id}</span>
                                <span className="status-badge" data-status={product.stateRaw}>
                                    {product.state}
                                </span>
                            </div>

                            <h2>{product.name}</h2>
                            <p className="owner-info">Held by: <span className="address">{product.currentOwner}</span></p>

                            <hr className="divider" />

                            <h3>⛓️ Supply Chain History</h3>
                            <div className="timeline">
                                {product.history.map((step, index) => (
                                    <div key={index} className="timeline-item">
                                        <div className="timeline-marker"></div>
                                        <div className="timeline-content">
                                            <div className="time">{step.timestamp}</div>
                                            <h4>{step.state}</h4>
                                            <p className="actor">Actor: {step.actor.slice(0, 8)}...</p>
                                            <p className="location">
                                                📍 {step.location.includes('|')
                                                    ? `${step.location.split('|')[1]} (${step.location.split('|')[0]})`
                                                    : step.location}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Customer Node - Final Node */}
                                {product.customerClaim && product.customerClaim.isClaimed && (
                                    <div className="timeline-item customer-node">
                                        <div className="timeline-marker customer-marker"></div>
                                        <div className="timeline-content customer-content">
                                            <div className="time">{product.customerClaim.timestamp}</div>
                                            <h4>🎉 Claimed by Customer</h4>
                                            <p className="customer-name">👤 {product.customerClaim.customerName}</p>
                                            <p className="actor">Wallet: {product.customerClaim.claimedBy.slice(0, 8)}...</p>
                                            <p className="location">
                                                📍 {product.customerClaim.location.includes('|')
                                                    ? `${product.customerClaim.location.split('|')[1]} (${product.customerClaim.location.split('|')[0]})`
                                                    : product.customerClaim.location}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TraceProduct;
