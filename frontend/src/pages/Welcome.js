// src/pages/Welcome.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSupplyChain } from "../hooks/useSupplyChain";
import "./Welcome.css";

const Welcome = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { contract, readOnlyContract } = useSupplyChain();
    const [liveStats, setLiveStats] = useState({ products: 0, verifications: 0, transfers: 0 });
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const fetchStats = async () => {
            const targetContract = contract || readOnlyContract;
            if (!targetContract) return;
            try {
                const productFilter = targetContract.filters.ProductCreated();
                const productEvents = await targetContract.queryFilter(productFilter);
                const verifyFilter = targetContract.filters.ProductVerified();
                const verifyEvents = await targetContract.queryFilter(verifyFilter);
                const transferFilter = targetContract.filters.CustodyTransferred();
                const transferEvents = await targetContract.queryFilter(transferFilter);
                setLiveStats({
                    products: productEvents.length,
                    verifications: verifyEvents.length,
                    transfers: transferEvents.length
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, [contract, readOnlyContract]);

    const features = [
        { title: "Immutable Registry", desc: "Every product starts its journey as a cryptographic entity on the blockchain.", icon: "💎" },
        { title: "Trustless Handover", desc: "Dynamic secret keys ensure only the rightful owner can accept custody.", icon: "🔑" },
        { title: "Consumer Trust", desc: "Instant verification for end-users via scan-and-claim technology.", icon: "🛡️" },
        { title: "End-to-End Visibility", desc: "Trace every hop in the supply chain with timestamped precision.", icon: "🌍" }
    ];

    return (
        <div className="welcome-page">
            <section className="welcome-hero">
                <motion.div
                    className="hero-floating-elements"
                    style={{ y: y1 }}
                >
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                </motion.div>

                <div className="hero-content">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <span className="hero-tag">Enterprise Blockchain Solution</span>
                        <h1>Secure the<br /><span className="text-glow">Supply Chain</span></h1>
                        <p>Eliminate counterfeits and establish absolute trust with our decentralized asset management protocol.</p>

                        <motion.div
                            className="hero-actions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            <Link to="/register" className="btn btn-primary">
                                <span>Get Started</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </Link>
                            <Link to="/login" className="btn btn-secondary">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                                <span>Sign In</span>
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="hero-stats"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                    >
                        <div className="stat-card">
                            <span className="stat-value">{liveStats.products}</span>
                            <span className="stat-label">Assets Minted</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{liveStats.transfers}</span>
                            <span className="stat-label">Transfers</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{liveStats.verifications}</span>
                            <span className="stat-label">Verified</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="features-grid-section">
                <div className="container">
                    <div className="grid-header">
                        <h2>The Protocol</h2>
                        <p>Advanced features designed for modern industrial scale.</p>
                    </div>

                    <div className="features-grid">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                className="feature-card glass"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -10 }}
                            >
                                <span className="feature-icon">{f.icon}</span>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <motion.div
                    className="cta-card glass"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <h2>Ready to secure your supply chain?</h2>
                    <p>Join the network of trusted manufacturers, distributors, and retailers globally.</p>
                    <Link to="/register" className="btn-primary">Create Account</Link>
                </motion.div>
            </section>
        </div>
    );
};

export default Welcome;
