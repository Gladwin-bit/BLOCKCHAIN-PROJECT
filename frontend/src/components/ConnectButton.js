import React from 'react';
import { motion } from 'framer-motion';

export function ConnectButton({ onClick, className = '' }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`btn btn-connect ${className}`}
            onClick={onClick}
        >
            <svg 
                className="metamask-icon" 
                viewBox="0 0 318.6 318.6" 
                width="24" 
                height="24" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: '10px' }}
            >
                <path fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" d="M274.8 35.5L174.6 109.4l-10.8 20 7.7 45.5 20.9 24.4 92.4-78.7z"/>
                <path fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" d="M43.8 35.5l100.1 73.9 10.8 20-7.7 45.5-20.9 24.4-92.4-78.7z"/>
                <path fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" d="M297.3 253.5l-20.4-64.1-92.4 78.7 9.3 10.4 91-11.4c4.3-1.4 12.5-13.6 12.5-13.6z"/>
                <path fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" d="M21.3 253.5l20.4-64.1 92.4 78.7-9.3 10.4-91-11.4c-4.3-1.4-12.5-13.6-12.5-13.6z"/>
                <path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" d="M115.9 148.8l10.8 35.6-32.5 1.3z"/>
                <path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" d="M202.7 148.8l-10.8 35.6 32.5 1.3z"/>
                <path fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" d="M101.7 268.3l9.3-10.4-20.9-24.4 20 4.4 17.3-43.8-32.8 1.3 7.1 72.9z"/>
                <path fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" d="M216.9 268.3l-9.3-10.4 20.9-24.4-20 4.4-17.3-43.8 32.8 1.3-7.1 72.9z"/>
                <path fill="#E17E26" stroke="#E17E26" strokeLinecap="round" strokeLinejoin="round" d="M115.9 148.8l32.8-1.3-10.8-20z"/>
                <path fill="#E17E26" stroke="#E17E26" strokeLinecap="round" strokeLinejoin="round" d="M202.7 148.8l-32.8-1.3 10.8-20z"/>
                <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M101.7 268.3l7.1-72.9-32.8 1.3z"/>
                <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M216.9 268.3l-7.1-72.9 32.8 1.3z"/>
                <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M101.7 268.3l87.4-10.4-9.3-10.4-67.3-4.4z"/>
                <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M216.9 268.3l-87.4-10.4 9.3-10.4 67.3-4.4z"/>
                <path fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" d="M191.9 257.9l-32.6 15.6-32.6-15.6 9.3 10.4 23.3 12.3 23.3-12.3z"/>
                <path fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" d="M159.3 315.1l-23.3-12.3 9.3-10.4-9.3 10.4z"/>
                <path fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" d="M159.3 315.1l23.3-12.3-9.3-10.4 9.3 10.4z"/>
                <path fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round" d="M159.3 315.1l-23.3-12.3 32.6-15.6z"/>
                <path fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round" d="M159.3 315.1l23.3-12.3-32.6-15.6z"/>
                <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M276.9 189.4l20.4 64.1-91 11.4 7.1-72.9 63.5-2.6z"/>
                <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M41.7 189.4l-20.4 64.1 91 11.4-7.1-72.9-63.5-2.6z"/>
                <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M159.3 128.8l10.8 20 32.8-1.3-43.6-18.7z"/>
                <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M159.3 128.8l-10.8 20-32.8-1.3 43.6-18.7z"/>
            </svg>
            Connect MetaMask
        </motion.button>
    );
}
