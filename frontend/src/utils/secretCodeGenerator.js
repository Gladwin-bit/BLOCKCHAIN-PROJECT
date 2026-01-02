// src/utils/secretCodeGenerator.js
import { ethers } from 'ethers';

/**
 * Generates a cryptographically secure secret code
 * Uses SHA-256 hashing with random bytes and timestamp
 * @param {string} productId - The product ID
 * @param {string} productName - The product name
 * @returns {string} - A secure secret code (64 characters hex)
 */
export const generateSecretCode = (productId, productName) => {
    // Generate random bytes
    const randomBytes = ethers.randomBytes(32);

    // Create a unique string combining product info, timestamp, and random data
    const uniqueString = `${productId}-${productName}-${Date.now()}-${ethers.hexlify(randomBytes)}`;

    // Hash it using SHA-256
    const hash = ethers.keccak256(ethers.toUtf8Bytes(uniqueString));

    // Return the hash without '0x' prefix
    return hash.slice(2);
};

/**
 * Generates a shorter, user-friendly secret code (16 characters)
 * Still cryptographically secure but easier to type/read
 * @param {string} productId - The product ID
 * @param {string} productName - The product name
 * @returns {string} - A secure secret code (16 characters)
 */
export const generateShortSecretCode = (productId, productName) => {
    const fullCode = generateSecretCode(productId, productName);
    // Take first 16 characters and format with dashes for readability
    const shortCode = fullCode.substring(0, 16);
    return `${shortCode.substring(0, 4)}-${shortCode.substring(4, 8)}-${shortCode.substring(8, 12)}-${shortCode.substring(12, 16)}`.toUpperCase();
};

/**
 * Hash a secret code for blockchain storage
 * @param {string} secretCode - The secret code to hash
 * @returns {string} - The hashed code
 */
export const hashSecretCode = (secretCode) => {
    return ethers.keccak256(ethers.toUtf8Bytes(secretCode));
};
