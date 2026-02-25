// src/pages/TraceProduct.js
import React, { useState } from "react";
import { useSupplyChain } from "../hooks/useSupplyChain";
import { ProductTimeline } from "../components/ProductTimeline";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck } from "lucide-react";
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
                setError(`Asset #${productId} not found on the active ledger.`);
            } else {
                setError(`Error connecting to node: ${e.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trace-product-page">
            <header className="page-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-1px' }}>
                    Trace Asset Journey
                </h1>
                <p className="subtitle" style={{ letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.7 }}>
                    Real-Time Supply Chain Audit
                </p>
            </header>

            {!account ? (
                <div className="connect-prompt" style={{ textAlign: 'center' }}>
                    <button className="btn btn-primary" onClick={connectWallet}>
                        Authorized Access Only
                    </button>
                </div>
            ) : (
                <div className="trace-content">
                    {/* SEARCH SECTION */}
                    <div className="trace-search-section">
                        <div className="search-card">
                            <div className="input-group search-group" style={{ maxWidth: '100%' }}>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="Enter Digital Thread ID (e.g., 1)"
                                    value={productId}
                                    onChange={(e) => setProductId(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleTrace()}
                                    style={{ background: 'white', color: 'black' }}
                                />
                                <button className="btn-icon" onClick={handleTrace} disabled={loading}>
                                    {loading ? "..." : <Search size={24} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                className="status-toast error"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{ margin: '0 auto' }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {product && !loading && (
                            <div className="product-inspection">
                                {/* ASSET SUMMARY BOARD */}
                                <div className="asset-summary-card">
                                    <div className="asset-info-left">
                                        <div className="asset-badge">SAREE THREAD #{product.id}</div>
                                        <h2>{product.name}</h2>
                                        <div className="asset-meta">
                                            <div className="meta-item">
                                                <label>Status</label>
                                                <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{product.state}</span>
                                            </div>
                                            <div className="meta-item">
                                                <label>Loom Location</label>
                                                <span>{product.loomLocation || "N/A"}</span>
                                            </div>
                                            <div className="meta-item">
                                                <label>Weave Date</label>
                                                <span>{product.weaveDate || "N/A"}</span>
                                            </div>
                                            <div className="meta-item">
                                                <label>Current Owner</label>
                                                <span>{product.currentOwner.slice(0, 6)}...{product.currentOwner.slice(-4)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ShieldCheck size={80} color="#D4AF37" style={{ opacity: 0.1 }} />
                                </div>

                                {/* HORIZONTAL MAP SECTION */}
                                <div className="journey-map-section" style={{ marginTop: '4rem' }}>
                                    <div className="map-header">
                                        <div className="live-indicator" />
                                        <h3>Geographic Audit Path</h3>
                                    </div>
                                    <ProductTimeline
                                        history={product.history}
                                        customerClaim={product.customerClaim}
                                    />
                                </div>
                            </div>
                        )}
                    </AnimatePresence>

                    {loading && <LoadingSpinner />}
                </div>
            )}
        </div>
    );
};

export default TraceProduct;
