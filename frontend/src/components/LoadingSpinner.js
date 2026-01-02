// src/components/LoadingSpinner.js
import React from 'react';
import { motion } from 'framer-motion';
import './LoadingSpinner.css';

export const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
    const sizes = {
        small: 30,
        medium: 50,
        large: 70
    };

    return (
        <div className="loading-spinner-container">
            <motion.div
                className="loading-spinner"
                style={{ width: sizes[size], height: sizes[size] }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
                <div className="spinner-ring" />
            </motion.div>
            {message && <p className="loading-message">{message}</p>}
        </div>
    );
};

export const SkeletonLoader = ({ width = '100%', height = '20px', count = 1 }) => {
    return (
        <div className="skeleton-container">
            {[...Array(count)].map((_, index) => (
                <motion.div
                    key={index}
                    className="skeleton-item"
                    style={{ width, height }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
};

export default LoadingSpinner;
