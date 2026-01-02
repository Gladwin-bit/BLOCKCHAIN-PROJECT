import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Shield, User, Calendar, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './CertificateViewer.css';

const CertificateViewer = ({ productHistory, productId, onClose }) => {
    const [certificates, setCertificates] = useState([]);
    const [productCertificate, setProductCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCertificates();
    }, [productId, productHistory]);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            setError(null);

            // Hardcoded URL - no environment variable
            const url = `http://localhost:5000/api/certificates/${productId}`;
            console.log('=== FETCHING CERTIFICATES ===');
            console.log('URL:', url);

            const response = await axios.get(url);
            console.log('Response:', response.data);

            if (response.data.success) {
                setCertificates(response.data.certificates);
                setProductCertificate(response.data.productCertificate || null);
                console.log('Certificates loaded:', response.data.certificates.length);
                console.log('Product certificate:', response.data.productCertificate);
            } else {
                setError('Failed to load certificates');
            }
        } catch (err) {
            console.error('=== CERTIFICATE FETCH ERROR ===');
            console.error('Error:', err);
            console.error('Message:', err.message);
            setError(err.response?.data?.message || 'Failed to load certificates');
            toast.error('Could not load certificates');
        } finally {
            setLoading(false);
        }
    };

    const getRoleIcon = (role) => {
        const icons = {
            manufacturer: '🏭',
            distributor: '🚚',
            retailer: '🏪',
            customer: '👤',
            intermediate: '📦'
        };
        return icons[role] || '👤';
    };

    const getRoleBadgeClass = (role) => {
        return `role-badge role-${role}`;
    };

    const handleDownload = (url, filename) => {
        const link = document.createElement('a');
        link.href = `http://localhost:5000${url}`;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            <motion.div
                className="certificate-viewer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="certificate-viewer-modal glass"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="header-content">
                            <Shield className="header-icon" size={24} />
                            <div>
                                <h2>Manufacturer Certificate</h2>
                                <p>Product #{productId} - Manufacturer Verification</p>
                            </div>
                        </div>
                        <button className="close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="modal-body">
                        {loading && (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading certificates...</p>
                            </div>
                        )}

                        {error && (
                            <div className="error-state">
                                <p>{error}</p>
                                <button className="btn btn-secondary" onClick={fetchCertificates}>
                                    Retry
                                </button>
                            </div>
                        )}

                        {!loading && !error && certificates.length === 0 && (
                            <div className="empty-state">
                                <FileText size={48} />
                                <p>Manufacturer certificate not found</p>
                            </div>
                        )}

                        {!loading && !error && certificates.length > 0 && (
                            <div className="certificates-grid">
                                {certificates.map((cert, index) => (
                                    <motion.div
                                        key={index}
                                        className="certificate-card glass"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="cert-header">
                                            <div className="cert-icon">
                                                {getRoleIcon(cert.role)}
                                            </div>
                                            <div className="cert-info">
                                                <h3>{cert.name}</h3>
                                                <span className={getRoleBadgeClass(cert.role)}>
                                                    {cert.role}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="cert-details">
                                            <div className="detail-row">
                                                <User size={14} />
                                                <span className="wallet-addr">
                                                    {cert.walletAddress ?
                                                        `${cert.walletAddress.slice(0, 8)}...${cert.walletAddress.slice(-6)}` :
                                                        'No wallet address'
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="cert-documents">
                                            {cert.hasCertificate && (
                                                <div className="doc-item">
                                                    <div className="doc-info">
                                                        <FileText size={16} />
                                                        <div>
                                                            <p className="doc-name">Authorization Certificate</p>
                                                            <p className="doc-date">
                                                                <Calendar size={12} />
                                                                {new Date(cert.certificate.uploadedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn-icon-small"
                                                        onClick={() => handleDownload(cert.certificate.url, cert.certificate.filename)}
                                                        title="Download Certificate"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            {cert.hasIdProof && (
                                                <div className="doc-item">
                                                    <div className="doc-info">
                                                        <Shield size={16} />
                                                        <div>
                                                            <p className="doc-name">ID Proof</p>
                                                            <p className="doc-date">
                                                                <Calendar size={12} />
                                                                {new Date(cert.idProof.uploadedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn-icon-small"
                                                        onClick={() => handleDownload(cert.idProof.url, cert.idProof.filename)}
                                                        title="Download ID Proof"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            {!cert.hasCertificate && !cert.hasIdProof && (
                                                <p className="no-docs">No documents available</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Product Certificate Section */}
                        {!loading && !error && productCertificate && (
                            <div className="product-certificate-section">
                                <h3 className="section-title">
                                    <FileText size={20} />
                                    Product-Specific Certificate
                                </h3>
                                <motion.div
                                    className="certificate-card glass product-cert"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="cert-header">
                                        <div className="cert-icon">📜</div>
                                        <div className="cert-info">
                                            <h3>Warranty & Authenticity Document</h3>
                                            <span className="badge badge-product">Product Certificate</span>
                                        </div>
                                    </div>

                                    <div className="cert-documents">
                                        <div className="doc-item">
                                            <div className="doc-info">
                                                <FileText size={16} />
                                                <div>
                                                    <p className="doc-name">{productCertificate.filename}</p>
                                                    <p className="doc-date">Product-specific authenticity certificate</p>
                                                </div>
                                            </div>
                                            <button
                                                className="btn-icon-small"
                                                onClick={() => handleDownload(productCertificate.url, productCertificate.filename)}
                                                title="Download Product Certificate"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <p className="footer-note">
                            <Shield size={14} />
                            All certificates are verified and stored securely
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CertificateViewer;
