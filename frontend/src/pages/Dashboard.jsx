import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = ({ product, account, onRecordVerification }) => {
    const [location, setLocation] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isLogging, setIsLogging] = useState(false);

    const handleRecord = async () => {
        if (!location) {
            toast.error("Location is required");
            return;
        }
        setIsLogging(true);
        try {
            await onRecordVerification(product.id, location, remarks);
            setLocation('');
            setRemarks('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <div className="dashboard-container fade-in">
            <header className="dashboard-header">
                <div className="status-badge verified">🛡️ AUTHENTIC PRODUCT</div>
                <h1>{product.name}</h1>
                <p className="owner-badge">Owner: <span>{product.currentOwner}</span></p>
            </header>

            <div className="dashboard-grid">
                {/* Verification History Section */}
                <section className="history-section glass-card">
                    <h3>⛓️ Immutable Verification History</h3>
                    <div className="verification-timeline">
                        {product.verifications && product.verifications.length > 0 ? (
                            product.verifications.map((log, idx) => (
                                <div key={idx} className="timeline-entry">
                                    <div className="entry-marker"></div>
                                    <div className="entry-content">
                                        <div className="entry-header">
                                            <span className="timestamp">{log.timestamp}</span>
                                            <span className="location">📍 {log.location}</span>
                                        </div>
                                        <p className="remarks">"{log.remarks || 'No remarks provided'}"</p>
                                        <span className="verifier">By: {log.verifier.slice(0, 8)}...</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-history">No verification logs yet. Be the first!</p>
                        )}
                    </div>
                </section>

                {/* Record Verification Form */}
                <section className="action-section glass-card">
                    <h3>✍️ Record New Verification</h3>
                    <p className="hint">Prove the item is active and authentic by signing the ledger.</p>
                    <div className="input-group">
                        <label>Current Location</label>
                        <input
                            type="text"
                            placeholder="e.g. London Boutique, Service Center"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label>Remarks</label>
                        <textarea
                            placeholder="Describe condition or event..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn-record-verification pulse"
                        onClick={handleRecord}
                        disabled={isLogging}
                    >
                        {isLogging ? 'Updating Ledger...' : '💎 Record Verification'}
                    </button>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
