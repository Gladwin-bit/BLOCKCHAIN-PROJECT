// src/pages/AdminPanel.js
import React, { useState } from "react";
import { ethers } from "ethers";
import { useSupplyChain, ROLES } from "../hooks/useSupplyChain";
import "./AdminPanel.css";

import { ConnectButton } from "../components/ConnectButton";

const AdminPanel = () => {
    const { account, connectWallet, grantRole, revokeRole, hasRole } = useSupplyChain();
    const [targetAddress, setTargetAddress] = useState("");
    const [selectedRole, setSelectedRole] = useState("MANUFACTURER"); // default key
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAction = async (action) => {
        if (!account) {
            setStatus("⚠️ Connect wallet first");
            return;
        }
        if (!targetAddress || !ethers.isAddress(targetAddress)) {
            setStatus("⚠️ Invalid Ethereum address");
            return;
        }

        setLoading(true);
        setStatus("Waiting for confirmation...");

        try {
            if (action === "GRANT") {
                await grantRole(selectedRole, targetAddress);
                setStatus(`✅ Granted ${selectedRole} to ${targetAddress.slice(0, 6)}...`);
            } else if (action === "REVOKE") {
                await revokeRole(selectedRole, targetAddress);
                setStatus(`🛑 Revoked ${selectedRole} from ${targetAddress.slice(0, 6)}...`);
            } else if (action === "CHECK") {
                const has = await hasRole(selectedRole, targetAddress);
                setStatus(has ? `✅ Address HAS role ${selectedRole}` : `❌ Address does NOT have role ${selectedRole}`);
            }

        } catch (e) {
            console.error(e);
            let errorMsg = "❌ Action failed. ";
            if (e.message?.includes("AccessControl")) {
                errorMsg += "Unauthorized (Admin only).";
            } else {
                errorMsg += e.reason || e.message || "Unknown error";
            }
            setStatus(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-panel container glass">
            <h2>👑 Admin - Manage Roles</h2>
            {!account ? (
                <ConnectButton onClick={connectWallet} />
            ) : (
                <div className="admin-form">
                    <p className="welcome">Logged in as: <span className="address">{account}</span></p>

                    <div className="input-group">
                        <label>Target Address</label>
                        <div className="address-input-wrapper">
                            <input
                                type="text"
                                placeholder="0x..."
                                value={targetAddress}
                                onChange={(e) => setTargetAddress(e.target.value)}
                            />
                            <button className="btn-small" onClick={() => setTargetAddress(account)}>
                                Use My Address
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="role-select"
                        >
                            <option value="MANUFACTURER">Manufacturer (Create Products)</option>
                            <option value="DISTRIBUTOR">Distributor (Transport)</option>
                            <option value="RETAILER">Retailer (Sell)</option>
                            <option value="ADMIN">Admin (Manage Roles)</option>
                        </select>
                    </div>

                    <div className="actions">
                        <button className="btn success" onClick={() => handleAction("GRANT")} disabled={loading}>
                            Grant Role
                        </button>
                        <button className="btn danger" onClick={() => handleAction("REVOKE")} disabled={loading}>
                            Revoke Role
                        </button>
                        <button className="btn info" onClick={() => handleAction("CHECK")} disabled={loading}>
                            Check Status
                        </button>
                    </div>

                    {loading && <p className="loading">Processing transaction...</p>}

                    {status && <div className={`status-box ${status.includes('❌') || status.includes('False') ? 'error' : 'success'}`}>
                        {status}
                    </div>}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
