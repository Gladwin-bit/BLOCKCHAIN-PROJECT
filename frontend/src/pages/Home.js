// src/pages/Home.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSupplyChain } from "../hooks/useSupplyChain";
import { useAuth } from "../context/AuthContext";
import { ConnectButton } from "../components/ConnectButton";
import { useSupplyChainContext } from "../context/SupplyChainContext";
import "./Home.css";

const STATE_META = {
    0: { label: "Created", cls: "s-created" },
    1: { label: "In Transit", cls: "s-transit" },
    2: { label: "Verified", cls: "s-verified" },
    3: { label: "Claimed", cls: "s-claimed" },
};

const Home = () => {
    const { contract, readOnlyContract, account, connectWallet } = useSupplyChainContext();
    const { getProductData } = useSupplyChain();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [sarees, setSarees] = useState([]);
    const [stats, setStats] = useState({ total: 0, inCustody: 0, transferred: 0 });
    const [loading, setLoading] = useState(false);
    const [fetchErr, setFetchErr] = useState("");
    const [expanded, setExpanded] = useState(null);

    const fetchMyProducts = useCallback(async () => {
        const tc = contract || readOnlyContract;
        if (!tc || !account) return;
        setLoading(true); setFetchErr("");
        try {
            const events = await tc.queryFilter(tc.filters.ProductCreated());
            const mine = events.filter(e =>
                e.args?.weaver?.toLowerCase() === account.toLowerCase()
            );
            if (!mine.length) {
                setSarees([]);
                setStats({ total: 0, inCustody: 0, transferred: 0 });
                return;
            }
            const enriched = await Promise.all(mine.map(async e => {
                const id = Number(e.args.id);
                try {
                    const data = await getProductData(id);
                    // Use blockchain data first, override with DB enrichment if available
                    let loomLocation = data.loomLocation || "—";
                    let weaveDate = data.weaveDate || "—";
                    try {
                        const r = await fetch(`http://localhost:5000/api/products/${id}`);
                        const j = await r.json();
                        if (j.success) {
                            if (j.product.loomLocation) loomLocation = j.product.loomLocation;
                            if (j.product.weaveDate) weaveDate = new Date(j.product.weaveDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                        }
                    } catch { /* non-critical */ }
                    return { id, name: data.name, stateRaw: data.stateRaw, state: data.state, currentOwner: data.currentOwner, loomLocation, weaveDate };
                } catch {
                    return { id, name: `Saree #${id}`, stateRaw: 0, state: "Created", currentOwner: account, loomLocation: "—", weaveDate: "—" };
                }
            }));
            enriched.sort((a, b) => b.id - a.id);
            setSarees(enriched);
            const inCus = enriched.filter(s => s.currentOwner?.toLowerCase() === account.toLowerCase()).length;
            setStats({ total: enriched.length, inCustody: inCus, transferred: enriched.length - inCus });
        } catch (err) {
            console.error(err);
            setFetchErr("Could not load sarees from blockchain. Ensure the contract is deployed and connected.");
        } finally {
            setLoading(false);
        }
    }, [contract, readOnlyContract, account, getProductData]);

    useEffect(() => { fetchMyProducts(); }, [fetchMyProducts]);

    const pending = sarees.filter(s => s.currentOwner?.toLowerCase() === account?.toLowerCase() && s.stateRaw === 0);
    const firstName = user?.name ? user.name.split(" ")[0] : "Weaver";
    const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })();

    // ── table body content ──────────────────────────────────────────
    const TableBody = () => {
        if (!account) return (
            <div className="tbl-state">
                <span className="tbl-state-icon">🔌</span>
                <p>Connect your MetaMask wallet to view your registered sarees.</p>
                <ConnectButton onClick={connectWallet} />
            </div>
        );
        if (loading) return (
            <div className="tbl-state">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block", fontSize: "2rem" }}>🥻</motion.span>
                <p>Fetching from blockchain…</p>
            </div>
        );
        if (fetchErr) return (
            <div className="tbl-state tbl-state--error">
                <span className="tbl-state-icon">⚠️</span>
                <p>{fetchErr}</p>
                <button className="btn btn-secondary" onClick={fetchMyProducts} style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>Try Again</button>
            </div>
        );
        if (!sarees.length) return (
            <div className="tbl-state">
                <span className="tbl-state-icon">📭</span>
                <p>No sarees registered yet. Start by registering your first saree.</p>
                <Link to="/create" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>+ Register First Saree</Link>
            </div>
        );
        return (
            <div className="tbl-wrap">
                <table className="saree-tbl">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Saree Name</th>
                            <th>Loom Location</th>
                            <th>Weave Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sarees.map(s => {
                            const sm = STATE_META[s.stateRaw] || STATE_META[0];
                            const isMine = s.currentOwner?.toLowerCase() === account?.toLowerCase();
                            const isOpen = expanded === s.id;
                            return (
                                <React.Fragment key={s.id}>
                                    <tr className={`tbl-row ${isOpen ? "tbl-row--open" : ""}`}
                                        onClick={() => setExpanded(isOpen ? null : s.id)}>
                                        <td><span className="id-tag">#{s.id}</span></td>
                                        <td className="td-bold">{s.name}</td>
                                        <td className="td-muted">{s.loomLocation}</td>
                                        <td className="td-muted">{s.weaveDate}</td>
                                        <td>
                                            <span className={`state-chip ${sm.cls}`}>{sm.label}</span>
                                            {isMine && <span className="you-chip">● You</span>}
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <div className="row-acts">
                                                {isMine && s.stateRaw === 0 && (
                                                    <Link to="/custody" className="ra-btn ra-primary" title="Generate Waybill">📤 Waybill</Link>
                                                )}
                                                <Link to="/trace" className="ra-btn ra-ghost" title="Trace">🔍 Trace</Link>
                                            </div>
                                        </td>
                                    </tr>
                                    {isOpen && (
                                        <tr className="expand-tr">
                                            <td colSpan={6}>
                                                <div className="expand-row">
                                                    <div className="er-item"><span className="er-lbl">Custodian</span><span className="er-val mono">{isMine ? "You (Active)" : `${s.currentOwner?.slice(0, 10)}…${s.currentOwner?.slice(-8)}`}</span></div>
                                                    <div className="er-item"><span className="er-lbl">Chain State</span><span className="er-val">{s.state}</span></div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="dash">

            {/* ─── HERO BAND ─────────────────────────────────────── */}
            <div className="hero-band">
                <div className="hero-content">
                    <div className="hero-left">
                        <span className="hero-eyebrow">{greeting}</span>
                        <h1 className="hero-name">{firstName}</h1>
                        <p className="hero-sub">Kasaragod Handloom · Manufacturer Portal</p>
                    </div>
                    <div className="hero-right">
                        {account ? (
                            <div className="wallet-chip">
                                <span className="wdot" />
                                <div>
                                    <span className="wlbl">MetaMask Connected</span>
                                    <span className="waddr">{account.slice(0, 8)}…{account.slice(-6)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="wallet-prompt">
                                <p>Connect wallet to load your data</p>
                                <ConnectButton onClick={connectWallet} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="dash-body">

                {/* ─── PENDING ALERT ─────────────────────────────── */}
                <AnimatePresence>
                    {pending.length > 0 && (
                        <motion.div className="pending-bar"
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <span>📬</span>
                            <div>
                                <strong>{pending.length} saree{pending.length > 1 ? "s" : ""} pending dispatch</strong>
                                <p>Still in your custody — generate a waybill to proceed.</p>
                            </div>
                            <button className="btn btn-primary" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}
                                onClick={() => navigate("/custody")}>Dispatch Now →</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── KPI CARDS ─────────────────────────────────── */}
                <div className="kpi-row">
                    {[
                        { label: "Total Registered", value: stats.total, icon: "🥻", accent: "#6B0F1A" },
                        { label: "In My Custody", value: stats.inCustody, icon: "📦", accent: "#B5591A" },
                        { label: "Transferred Out", value: stats.transferred, icon: "🚚", accent: "#1E7A50" },
                    ].map((k, i) => (
                        <motion.div key={k.label} className="kpi-card"
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                            <div className="kpi-header">
                                <span className="kpi-ico">{k.icon}</span>
                                <span className="kpi-lbl">{k.label}</span>
                            </div>
                            <div className="kpi-num" style={{ color: k.accent }}>
                                {loading ? "·" : k.value}
                            </div>
                            <div className="kpi-track">
                                <div className="kpi-fill" style={{
                                    width: stats.total
                                        ? `${Math.round((k.value / stats.total) * 100)}%`
                                        : "0%",
                                    background: k.accent
                                }} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── DIVIDER ────────────────────────────────────── */}
                <div className="section-divider">
                    <span className="sd-label">Workspace</span>
                </div>

                {/* ─── MAIN CONTENT GRID ─────────────────────────── */}
                <div className="workspace-grid">

                    {/* Action sidebar */}
                    <aside className="actions-col">
                        <p className="col-title">Quick Actions</p>
                        {[
                            {
                                to: "/create", icon: "✨", title: "Register New Saree",
                                desc: "Mint a saree on-chain with material details and consumer codes.",
                                btnLabel: "+ Register", primary: true
                            },
                            {
                                to: "/custody", icon: "📤", title: "Manage Handover",
                                desc: "Transfer custody using the secure QR waybill protocol.",
                                btnLabel: "Open Panel →", primary: false
                            },
                            {
                                to: "/trace", icon: "🔍", title: "Trace a Saree",
                                desc: "Follow any registered saree's full supply chain journey.",
                                btnLabel: "Open Trace →", primary: false
                            },
                        ].map((a, i) => (
                            <motion.div key={a.to} className={`action-card ${a.primary ? "action-card--primary" : ""}`}
                                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                                <span className="ac-icon">{a.icon}</span>
                                <div className="ac-body">
                                    <h3>{a.title}</h3>
                                    <p>{a.desc}</p>
                                </div>
                                <Link to={a.to}
                                    className={`ac-btn ${a.primary ? "btn btn-primary" : "btn btn-secondary"}`}>
                                    {a.btnLabel}
                                </Link>
                            </motion.div>
                        ))}
                    </aside>

                    {/* Sarees table panel */}
                    <motion.section className="sarees-panel"
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                        <div className="panel-hd">
                            <div>
                                <h2 className="panel-title">My Registered Sarees</h2>
                                <p className="panel-sub">
                                    {!loading && !fetchErr && `${sarees.length} record${sarees.length !== 1 ? "s" : ""} found`}
                                </p>
                            </div>
                            <button className="refresh-btn" onClick={fetchMyProducts} disabled={loading}>
                                ↻ {loading ? "Loading…" : "Refresh"}
                            </button>
                        </div>
                        <TableBody />
                    </motion.section>

                </div>
            </div>
        </div>
    );
};

export default Home;