// src/pages/Welcome.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Sparkles, Map, Award, ArrowRight, LogIn, Search } from 'lucide-react';
import { useSupplyChain } from "../hooks/useSupplyChain";
import SmoothScroll from "../components/SmoothScroll";
import ScrollReveal from "../components/animations/ScrollReveal";
import "./Welcome.css";
import "./VerifyStyles.css";

const Welcome = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { contract, readOnlyContract } = useSupplyChain();
    const [liveStats, setLiveStats] = useState({ products: 0, verifications: 0, transfers: 0 });
    const [verifyCode, setVerifyCode] = useState('');
    const { scrollY } = useScroll();

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

    const handleVerify = () => {
        if (verifyCode.trim()) {
            navigate(`/verify-product?code=${verifyCode}`);
        }
    };

    const features = [
        { title: "Digital Handloom Mark", desc: "Each saree is registered on blockchain with a unique certificate of authenticity.", icon: <Award /> },
        { title: "Direct from Weaver", desc: "Transparent chain from artisan's loom to your wardrobe, supporting local weavers.", icon: <Sparkles /> },
        { title: "Verify Authenticity", desc: "Instantly check if your saree is genuine with our blockchain verification system.", icon: <ShieldCheck /> },
        { title: "Track Your Saree's Journey", desc: "Trace every step from weaving to delivery with complete timestamp records.", icon: <Map /> }
    ];

    return (
        <SmoothScroll>
            <div className="welcome-page">
                <div className="dynamic-glow glow-1"></div>
                <div className="dynamic-glow glow-2"></div>
                <section className="welcome-hero">

                    <div className="hero-content">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <span className="hero-tag">Kasaragod Handloom Heritage</span>
                            <h1>Authentic Kasaragod<br /><span className="text-glow">Sarees</span></h1>
                            <p>Verify the authenticity of your handloom saree with blockchain technology. Every thread tells a story from weaver to wearer.</p>

                            <motion.div
                                className="hero-cta"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                            >
                                <Link to="/register" className="btn btn-primary">
                                    Register Your Business
                                    <ArrowRight size={20} style={{ marginLeft: '10px' }} />
                                </Link>
                                <Link to="/login" className="btn btn-secondary">
                                    <LogIn size={20} style={{ marginRight: '10px' }} />
                                    Sign In
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Verification Section */}
                        <ScrollReveal direction="up" distance={30} delay={0.3}>
                            <div className="verify-section">
                                <input
                                    type="text"
                                    className="verify-input"
                                    placeholder="Enter your saree verification code"
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                                />
                                <button className="verify-btn" onClick={handleVerify}>
                                    <Search size={20} />
                                </button>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal direction="up" distance={40} delay={0.4}>
                            <div className="hero-stats">
                                <div className="stat-card">
                                    <span className="stat-value">{liveStats.products}</span>
                                    <span className="stat-label">Authentic Sarees</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">{liveStats.transfers}</span>
                                    <span className="stat-label">Artisans Supported</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">{liveStats.verifications}</span>
                                    <span className="stat-label">Verified Purchases</span>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                <section className="features-grid-section">
                    <div className="container">
                        <ScrollReveal direction="up" distance={30}>
                            <div className="grid-header">
                                <h2>Blockchain-Powered Authenticity</h2>
                                <p>Preserving Kasaragod's handloom tradition through modern technology.</p>
                            </div>
                        </ScrollReveal>

                        <div className="features-grid">
                            {features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="feature-card glass"
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
                    <ScrollReveal direction="up" distance={50}>
                        <motion.div
                            className="cta-card glass"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <h2>Ready to register your sarees?</h2>
                            <p>Join Kasaragod's network of verified weavers, cooperatives, and authentic saree sellers.</p>
                            <Link to="/register" className="btn btn-primary">Create Account</Link>
                        </motion.div>
                    </ScrollReveal>
                </section>
            </div>
        </SmoothScroll>
    );
};

export default Welcome;
