import React from 'react';
import { CheckCircle, AlertTriangle, Clock, Package } from 'lucide-react';
import './WaybillCertificate.css';

const WaybillCertificate = ({ waybill, isVerified, productData }) => {
    if (!waybill) return null;

    return (
        <div className="waybill-certificate glass fade-in">
            <div className="cert-header">
                <Package className="cert-icon" />
                <h4>📦 Incoming Shipment Certificate</h4>
            </div>

            <div className="cert-body">
                <div className="cert-row">
                    <span className="cert-label">Product ID:</span>
                    <span className="cert-value">#{waybill.productId}</span>
                </div>

                <div className="cert-row">
                    <span className="cert-label">From Sender:</span>
                    <span className="cert-value">
                        {waybill.senderAddress.slice(0, 6)}...{waybill.senderAddress.slice(-4)}
                        {isVerified ? (
                            <CheckCircle className="verified-icon" style={{ color: '#4CAF50' }} />
                        ) : (
                            <AlertTriangle className="warning-icon" style={{ color: '#ff9800' }} />
                        )}
                    </span>
                </div>

                {productData && (
                    <div className="cert-row">
                        <span className="cert-label">Product Name:</span>
                        <span className="cert-value">{productData.name}</span>
                    </div>
                )}

                <div className="cert-row">
                    <span className="cert-label">Timestamp:</span>
                    <span className="cert-value">
                        <Clock size={14} style={{ marginRight: '4px' }} />
                        {new Date(waybill.timestamp).toLocaleString()}
                    </span>
                </div>

                <div className="cert-row">
                    <span className="cert-label">Handover Key:</span>
                    <span className="cert-value cert-key-hidden">••••••••••••</span>
                </div>
            </div>

            <div className="cert-footer">
                {isVerified ? (
                    <div className="cert-status verified">
                        <CheckCircle size={16} />
                        <span>Sender Verified - Ready to Accept</span>
                    </div>
                ) : (
                    <div className="cert-status warning">
                        <AlertTriangle size={16} />
                        <span>Warning: Sender address does not match current owner</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WaybillCertificate;
