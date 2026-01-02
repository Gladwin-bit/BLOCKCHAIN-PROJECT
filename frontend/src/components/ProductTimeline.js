// src/components/ProductTimeline.js
import React from 'react';
import { motion } from 'framer-motion';
import './ProductTimeline.css';

const ProductTimeline = ({ history }) => {
    if (!history || history.length === 0) {
        return (
            <div className="timeline-empty">
                <p>No history available for this product yet.</p>
            </div>
        );
    }

    const getStatusIcon = (status) => {
        const icons = {
            'Created': '🏭',
            'In Transit': '🚚',
            'At Retailer': '🏪',
            'Sold': '🛒',
            'Consumed': '✅',
            'Stolen': '🚨',
            'Disputed': '⚠️'
        };
        return icons[status] || '📦';
    };

    const getStatusColor = (status) => {
        const colors = {
            'Created': '#3b82f6',
            'In Transit': '#8b5cf6',
            'At Retailer': '#10b981',
            'Sold': '#f59e0b',
            'Consumed': '#22c55e',
            'Stolen': '#ef4444',
            'Disputed': '#f97316'
        };
        return colors[status] || '#6b7280';
    };

    return (
        <div className="product-timeline">
            <h3>📍 Product Journey</h3>
            <div className="timeline-container">
                {history.map((event, index) => (
                    <motion.div
                        key={index}
                        className="timeline-event"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                        <div className="timeline-marker" style={{ backgroundColor: getStatusColor(event.status) }}>
                            <span className="timeline-icon">{getStatusIcon(event.status)}</span>
                        </div>
                        <div className="timeline-content glass">
                            <div className="timeline-header">
                                <h4>{event.status}</h4>
                                <span className="timeline-time">{event.timestamp}</span>
                            </div>
                            <div className="timeline-details">
                                <p><strong>📍 Location:</strong> {event.location.includes('|') ? event.location.split('|')[1] : event.location}</p>
                                <p className="coords-hint">{event.location.includes('|') ? event.location.split('|')[0] : ""}</p>
                                <p><strong>👤 Handler:</strong> {event.actor ? (event.actor.slice(0, 6) + "..." + event.actor.slice(-4)) : "Unknown"}</p>
                                {event.note && <p><strong>📝 Note:</strong> {event.note}</p>}
                            </div>
                        </div>
                        {index < history.length - 1 && (
                            <div className="timeline-line" style={{ borderColor: getStatusColor(event.status) }} />
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ProductTimeline;
