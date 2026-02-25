// src/components/ProductTimeline.js
import React from 'react';
import { motion } from 'framer-motion';
import {
    Factory,
    Truck,
    Store,
    UserCheck,
    Package,
    MapPin,
    User,
    Calendar,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import './ProductTimeline.css';

export const ProductTimeline = ({ history, customerClaim }) => {
    if (!history || history.length === 0) {
        return (
            <div className="timeline-empty">
                <p>No history available for this product yet.</p>
            </div>
        );
    }

    const icons = {
        'Created': <Factory size={28} />,
        'Verified': <ShieldCheck size={28} />,
        'In Transit': <Truck size={28} />,
        'At Shop': <Store size={28} />,
        'Sold': <UserCheck size={28} />,
        'Claimed': <UserCheck size={28} />,
        'Default': <Package size={28} />
    };

    const getStatusIcon = (status) => icons[status] || icons['Default'];

    return (
        <div className="product-timeline">
            <div className="timeline-container">
                {/* Visual Path Path Line */}
                <div className="timeline-path" />

                {history.map((event, index) => (
                    <motion.div
                        key={index}
                        className="timeline-event"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15 }}
                    >
                        <div className="timeline-marker">
                            <span className="timeline-icon">
                                {getStatusIcon(event.state || event.status)}
                            </span>
                        </div>

                        <div className="timeline-content">
                            <div className="timeline-header">
                                <h4>{event.state || event.status}</h4>
                                <span className="timeline-time">
                                    {event.timestamp}
                                </span>
                            </div>

                            <div className="timeline-details">
                                <div className="detail-row">
                                    <MapPin size={14} />
                                    <span>{event.location && event.location.includes('|') ? event.location.split('|')[1] : (event.location || "Central Hub")}</span>
                                </div>
                                <div className="detail-row">
                                    <User size={14} />
                                    <span>Actor: <strong>{event.actor ? (event.actor.slice(0, 6) + "..." + event.actor.slice(-4)) : "Unknown"}</strong></span>
                                </div>
                                {event.note && (
                                    <div className="detail-row">
                                        <ChevronRight size={14} />
                                        <span>{event.note}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Final Customer Node if available */}
                {customerClaim && customerClaim.isClaimed && (
                    <motion.div
                        className="timeline-event customer-event"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: history.length * 0.15 }}
                    >
                        <div className="timeline-marker">
                            <span className="timeline-icon">
                                <UserCheck size={28} />
                            </span>
                        </div>

                        <div className="timeline-content">
                            <div className="timeline-header">
                                <h4>Final Delivery</h4>
                                <span className="timeline-time">{customerClaim.timestamp}</span>
                            </div>

                            <div className="timeline-details">
                                <div className="detail-row">
                                    <User size={14} />
                                    <span>Recipient: <strong>{customerClaim.customerName}</strong></span>
                                </div>
                                <div className="detail-row">
                                    <MapPin size={14} />
                                    <span>{customerClaim.location && customerClaim.location.includes('|') ? customerClaim.location.split('|')[1] : customerClaim.location}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

