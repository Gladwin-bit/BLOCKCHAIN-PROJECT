import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load contract ABI and address - go up from backend/ to project root
const projectRoot = path.join(__dirname, '..');
const contractAddressPath = path.join(projectRoot, 'frontend', 'src', 'contract-address.json');
const contractABIPath = path.join(projectRoot, 'frontend', 'src', 'SupplyChain.json');

let contractAddress;
let contractABI;

try {
    console.log('Loading contract from:', contractAddressPath);
    const addressData = JSON.parse(fs.readFileSync(contractAddressPath, 'utf8'));
    contractAddress = addressData.address;
    console.log('Contract address loaded:', contractAddress);

    const abiData = JSON.parse(fs.readFileSync(contractABIPath, 'utf8'));
    contractABI = abiData.abi;
    console.log('Contract ABI loaded successfully');
} catch (error) {
    console.error('Error loading contract config:', error);
    console.error('Address path:', contractAddressPath);
    console.error('ABI path:', contractABIPath);
}

export const getContract = async () => {
    if (!contractAddress || !contractABI) {
        throw new Error('Contract configuration not loaded');
    }

    // Connect to local Hardhat node
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    return contract;
};

export default { getContract };
