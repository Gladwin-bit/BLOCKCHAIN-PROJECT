import { ethers } from 'ethers';
import contractABI from '../SupplyChain.json';
import contractAddress from '../contract-address.json';

/**
 * Register user's certificate IPFS hash on blockchain
 * User signs transaction with MetaMask and pays gas fees
 * @param {string} ipfsHash - IPFS hash (CID) of the certificate
 * @returns {Promise<Object>} Transaction receipt with hash, block number, and gas used
 */
export const registerCertificateOnBlockchain = async (ipfsHash) => {
    try {
        // Check if MetaMask is installed
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
        }

        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Create provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        console.log('Registering certificate on blockchain...');
        console.log('IPFS Hash:', ipfsHash);
        console.log('User address:', await signer.getAddress());

        // Create contract instance
        const contract = new ethers.Contract(
            contractAddress.address,
            contractABI.abi,
            signer
        );

        // Call registerUserCertificate - this will prompt MetaMask
        const tx = await contract.registerUserCertificate(ipfsHash);
        console.log('Transaction sent:', tx.hash);

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        return {
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        };

    } catch (error) {
        console.error('Blockchain registration error:', error);

        // Handle specific errors
        if (error.code === 'ACTION_REJECTED') {
            throw new Error('Transaction rejected by user');
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            throw new Error('Insufficient funds to pay gas fees');
        } else if (error.message?.includes('user rejected')) {
            throw new Error('Transaction rejected by user');
        } else {
            throw new Error(error.message || 'Failed to register certificate on blockchain');
        }
    }
};

/**
 * Get user's certificate IPFS hash from blockchain
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<string>} IPFS hash
 */
export const getUserCertificateFromBlockchain = async (userAddress) => {
    try {
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
            contractAddress.address,
            contractABI.abi,
            provider
        );

        const ipfsHash = await contract.getUserCertificate(userAddress);
        return ipfsHash;

    } catch (error) {
        console.error('Error fetching certificate from blockchain:', error);
        throw error;
    }
};

/**
 * Check if user has registered their certificate on blockchain
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<boolean>} True if certificate is registered
 */
export const hasCertificateOnBlockchain = async (userAddress) => {
    try {
        const ipfsHash = await getUserCertificateFromBlockchain(userAddress);
        return ipfsHash && ipfsHash.trim() !== '';
    } catch (error) {
        return false;
    }
};
