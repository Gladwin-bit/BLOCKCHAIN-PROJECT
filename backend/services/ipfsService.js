import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

/**
 * IPFS Service using Pinata
 * Handles file uploads to IPFS via Pinata API
 */
class IPFSService {
    constructor() {
        this.pinataGateway = 'https://gateway.pinata.cloud/ipfs/';
        console.log('📦 IPFS Service module loaded');
    }

    /**
     * Get Pinata JWT from environment
     * @returns {string} JWT token
     */
    getPinataJWT() {
        return process.env.PINATA_JWT;
    }

    /**
     * Upload a file to IPFS via Pinata
     * @param {Object} file - File object with path and filename
     * @returns {Promise<Object>} Object containing ipfsHash and ipfsUrl
     */
    async uploadFile(file) {
        try {
            const pinataJWT = this.getPinataJWT();
            const isDemoMode = process.env.DEMO_MODE === 'true' || !pinataJWT;

            if (!pinataJWT) {
                if (isDemoMode) {
                    console.warn('⚠️ PINATA_JWT not found. Running in DEMO MODE.');
                    console.warn('   Using mock IPFS hash for local development.');

                    // Artificial delay to simulate network upload
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    const mockHash = `QmDEMO${Math.random().toString(36).substring(2, 12)}MOCK`;
                    return {
                        ipfsHash: mockHash,
                        ipfsUrl: `${this.pinataGateway}${mockHash}`,
                        isMock: true
                    };
                }

                console.error('❌ PINATA_JWT not found in environment variables');
                console.error('   Please ensure PINATA_JWT is set in backend/.env file');
                throw new Error('Pinata JWT not configured');
            }

            console.log('✅ Pinata JWT found, uploading to IPFS...');

            // Create form data
            const formData = new FormData();
            const fileStream = fs.createReadStream(file.path);
            formData.append('file', fileStream, file.originalname || file.filename);

            // Optional: Add metadata
            const metadata = JSON.stringify({
                name: file.originalname || file.filename,
                keyvalues: {
                    uploadedAt: new Date().toISOString(),
                    type: 'authorization-certificate'
                }
            });
            formData.append('pinataMetadata', metadata);

            // Upload to Pinata
            const response = await axios.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${pinataJWT}`,
                        ...formData.getHeaders()
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            const ipfsHash = response.data.IpfsHash;
            const ipfsUrl = `${this.pinataGateway}${ipfsHash}`;

            console.log('✅ File uploaded to IPFS');
            console.log('   IPFS Hash:', ipfsHash);
            console.log('   Gateway URL:', ipfsUrl);

            return {
                ipfsHash,
                ipfsUrl,
                pinataResponse: response.data
            };

        } catch (error) {
            console.error('❌ IPFS upload error:', error.message);
            if (error.response) {
                console.error('   Response data:', error.response.data);
                console.error('   Response status:', error.response.status);
            }
            throw new Error(`Failed to upload file to IPFS: ${error.message}`);
        }
    }

    /**
     * Get IPFS gateway URL from hash
     * @param {string} ipfsHash - IPFS hash (CID)
     * @returns {string} Gateway URL
     */
    getGatewayUrl(ipfsHash) {
        return `${this.pinataGateway}${ipfsHash}`;
    }

    /**
     * Optional: Unpin a file from Pinata (to free up storage)
     * @param {string} ipfsHash - IPFS hash to unpin
     * @returns {Promise<boolean>} Success status
     */
    async unpinFile(ipfsHash) {
        try {
            const pinataJWT = this.getPinataJWT();

            if (!pinataJWT) {
                throw new Error('Pinata JWT not configured');
            }

            await axios.delete(
                `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
                {
                    headers: {
                        'Authorization': `Bearer ${pinataJWT}`
                    }
                }
            );

            console.log('✅ File unpinned from IPFS:', ipfsHash);
            return true;

        } catch (error) {
            console.error('❌ IPFS unpin error:', error.message);
            return false;
        }
    }
}

export default new IPFSService();
