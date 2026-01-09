// src/pages/Home.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { useSupplyChain } from "../hooks/useSupplyChain";
import SupplyChainNetwork from "../components/3D/SupplyChainNetwork";
import "./Home.css";

const Home = () => {
    const { contract, readOnlyContract } = useSupplyChain();
    const [liveStats, setLiveStats] = useState({ products: 0, verifications: 0, transfers: 0 });
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

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
        { title: "Immutable Registry", desc: "Every product starts its journey as a cryptographic entity on the blockchain.", icon: "💎", link: "/create" },
        { title: "Trustless Handover", desc: "Dynamic secret keys ensure only the rightful owner can accept custody.", icon: "🔑", link: "/custody" },
        { title: "Consumer Trust", desc: "Instant verification for end-users via scan-and-claim technology.", icon: "🛡️", link: "/verify" },
        { title: "End-to-End Visibility", desc: "Trace every hop in the supply chain with timestamped precision.", icon: "🌍", link: "/trace" }
    ];

    return (
        <div
            className="home-page"
            style={{
                '--bg-image': `url(${process.env.PUBLIC_URL}/supply-chain-bg.png)`
            }}
        >
            <section className="hero">
                <motion.div
                    className="hero-floating-elements"
                    style={{ y: y1 }}
                >
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                </motion.div>

                <div className="hero-content">
                    {/* 3D Background Visualization */}
                    <div className="hero-3d-container">
                        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={0.8} />
                            <pointLight position={[-10, -10, -10]} intensity={0.3} />
                            <SupplyChainNetwork />
                        </Canvas>
                    </div>

                    {/* Hero Text Box */}
                    <div className="hero-text-box">
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
                                <Link to="/trace" className="btn btn-primary">
                                    <span>Get Started</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </Link>
                                <Link to="/verify" className="btn btn-secondary">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                    <span>Verify Asset</span>
                                </Link>
                            </motion.div>
                        </motion.div>
                    </div>

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
                                <Link to={f.link} className="feature-link">Explore →</Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


        </div >
    );
};

export default Home;