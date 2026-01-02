import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSupplyChain } from "../hooks/useSupplyChain";
import { motion } from "framer-motion";
import ProductTimeline from "../components/ProductTimeline";
import LoadingSpinner from "../components/LoadingSpinner";
import "./VerifyProduct.css"; // Reuse verification styles

const ConsumerView = () => {
    const { productId } = useParams();
    const { getProductData } = useSupplyChain();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const data = await getProductData(productId);
                setProduct(data);
            } catch (err) {
                console.error(err);
                setError(err.message || "Product not found");
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchProduct();
    }, [productId, getProductData]);

    if (loading) return <div className="container" style={{ padding: '100px 0' }}><LoadingSpinner /></div>;

    if (error) {
        return (
            <div className="container glass" style={{ margin: '100px auto', padding: '50px', textAlign: 'center' }}>
                <h2>Error</h2>
                <p>{error}</p>
                <Link to="/" className="btn btn-secondary">Back Home</Link>
            </div>
        );
    }

    return (
        <motion.div
            className="container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '4rem 2rem' }}
        >
            <div className="glass" style={{ padding: '3rem' }}>
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1>{product.name}</h1>
                    <div className="status-badge" style={{ display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '20px', background: 'var(--accent-gold-glow)', color: 'var(--accent-gold)' }}>
                        Status: {product.state}
                    </div>
                </header>

                <div className="product-details">
                    <section style={{ marginBottom: '4rem' }}>
                        <h3>Provenance Journey</h3>
                        <ProductTimeline history={product.history} />
                    </section>

                    {product.verifications && product.verifications.length > 0 && (
                        <section>
                            <h3>Expert Verifications</h3>
                            <div className="verifications-list">
                                {product.verifications.map((v, i) => (
                                    <div key={i} className="verification-item glass" style={{ padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                                        <p><strong>Verifier:</strong> {v.verifier}</p>
                                        <p><strong>Location:</strong> {v.location && v.location.includes('|') ? v.location.split('|')[1] : (v.location || "Unknown")}</p>
                                        <p><strong>Remarks:</strong> {v.remarks}</p>
                                        <small>{v.timestamp}</small>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ConsumerView;
