import React from 'react';
import { CheckCircle, AlertTriangle, Clock, Package } from 'lucide-react';
import './WaybillCertificate.css';

const WaybillCertificate = ({ waybill, isVerified, productData }) => {
    if (!waybill) return null;

    return (
        <div className="waybill-certificate fade-in">
            <div className="cert-header">
                <Package className="cert-icon" size={24} />
                <h4>Inbound Waybill Manifest</h4>
            </div>

            <div className="cert-body">
                <div className="cert-row">
                    <span className="cert-label">Asset ID</span>
                    <span className="cert-value">#{waybill.productId}</span>
                </div>

                <div className="cert-row">
                    <span className="cert-label">Origin Sender</span>
                    <span className="cert-value">
                        {waybill.senderAddress.slice(0, 10)}...{waybill.senderAddress.slice(-8)}
                        {isVerified ? (
                            <CheckCircle className="verified-icon" size={18} />
                        ) : (
                            <AlertTriangle className="warning-icon" size={18} />
                        )}
                    </span>
                </div>

                {productData && (
                    <div className="cert-row">
                        <span className="cert-label">Asset Tag</span>
                        <span className="cert-value">{productData.name}</span>
                    </div>
                )}

                <div className="cert-row">
                    <span className="cert-label">Transmission Date</span>
                    <span className="cert-value">
                        <Clock size={14} />
                        {new Date(waybill.timestamp).toLocaleDateString()} {new Date(waybill.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="cert-row">
                    <span className="cert-label">Handover Pass</span>
                    <span className="cert-value cert-key-hidden">PROTECTED</span>
                </div>
            </div>

            <div className="cert-footer">
                {isVerified ? (
                    <div className="cert-status verified">
                        <CheckCircle size={18} />
                        <span>Source Authenticity Verified</span>
                    </div>
                ) : (
                    <div className="cert-status warning">
                        <AlertTriangle size={18} />
                        <span>Sender Mismatch Detected</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WaybillCertificate;
