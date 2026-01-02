import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import contractData from '../contract-address.json';
import './BlockchainExplorer.css';

const SUPPLY_CHAIN_ABI = [
    "function createProduct(string _name, bytes32 _secretHash) public",
    "function generateHandover(uint256 _id, bytes32 _newHash) public",
    "function acceptHandover(uint256 _id, string _secretKey, bytes32 _nextHash, string _location) public",
    "function verifyAndClaim(uint256 id, string secretKey) public",
    "function recordVerification(uint256 id, string location, string remarks) public",
    "function transferOwnership(uint256 id, address to) public",
    "function updateSecret(uint256 id, bytes32 newHash) public"
];

const BlockchainExplorer = () => {
    const iface = new ethers.Interface(SUPPLY_CHAIN_ABI);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        latestBlock: 0,
        network: 'Loading...',
        gasPrice: '0'
    });

    const fetchBlockchainData = useCallback(async () => {
        try {
            const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            const blockNumber = await provider.getBlockNumber();
            const network = await provider.getNetwork();
            const feeData = await provider.getFeeData();

            setStats({
                latestBlock: blockNumber,
                network: network.name === 'unknown' ? 'Hardhat Node' : network.name,
                gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei')
            });

            const blockPromises = [];
            // Fetch last 10 blocks
            for (let i = 0; i < 10; i++) {
                if (blockNumber - i >= 0) {
                    blockPromises.push(provider.getBlock(blockNumber - i, true));
                }
            }

            const resolvedBlocks = await Promise.all(blockPromises);

            // Filter: Hide Genesis (0) and only show blocks with decoded Supply Chain activity
            // This provides the "Clean Start" look the user requested
            const filteredBlocks = resolvedBlocks.filter(block => {
                if (!block || block.number === 0) return false;

                // If it's block #1 and it only has 1 txn (deployment), hide it unless it's a real call
                if (block.number === 1 && block.transactions.length === 1) {
                    const tx = block.transactions[0];
                    if (!getTransactionDesc(tx)) return false;
                }

                return true;
            });

            setBlocks(filteredBlocks);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching blockchain data:", error);
            toast.error("Failed to connect to local Hardhat node");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlockchainData();
        const interval = setInterval(fetchBlockchainData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [fetchBlockchainData]);

    const formatAddress = (addr) => {
        if (!addr) return '0x...';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const getTransactionDesc = (tx) => {
        if (!tx || !tx.data || tx.data === '0x') return null;
        try {
            const parsed = iface.parseTransaction({ data: tx.data });
            if (!parsed) return null;

            switch (parsed.name) {
                case 'createProduct':
                    return `CREATE: ${parsed.args.name}`;
                case 'verifyAndClaim':
                    return `CLAIM & VERIFY #${parsed.args.id}`;
                case 'recordVerification':
                    return `VERIFIED #${parsed.args.id}`;
                case 'transferOwnership':
                    return `TRANSFER #${parsed.args.id} to ${formatAddress(parsed.args.to)}`;
                case 'updateSecret':
                    return `UPDATE SECRET #${parsed.args.id}`;
                default:
                    return parsed.name.toUpperCase();
            }
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="explorer-container">
            <div className="explorer-header">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Ledger Explorer
                </motion.h1>
                <div className="stats-grid">
                    <div className="stat-card glass">
                        <span className="stat-label">Network</span>
                        <span className="stat-value text-info">{stats.network}</span>
                    </div>
                    <div className="stat-card glass">
                        <span className="stat-label">Latest Block</span>
                        <span className="stat-value text-gold">#{stats.latestBlock}</span>
                    </div>
                    <div className="stat-card glass">
                        <span className="stat-label">Gas Price</span>
                        <span className="stat-value">{parseFloat(stats.gasPrice).toFixed(2)} Gwei</span>
                    </div>
                </div>
            </div>

            <div className="explorer-content">
                <div className="section-header">
                    <h2>Recent Blocks</h2>
                    <button className="refresh-btn" onClick={fetchBlockchainData}>
                        <span>🔄</span> Sync
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="pulse-loader"></div>
                        <p>Scanning blockchain...</p>
                    </div>
                ) : (
                    <div className="blocks-list">
                        <AnimatePresence>
                            {blocks.length === 0 ? (
                                <motion.div
                                    className="empty-ledger-state glass"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="empty-icon shadow-glow">🛡️</div>
                                    <h3>Ledger is Clean & Clear</h3>
                                    <p>No supply chain activity recorded on the current network yet.</p>
                                    <span className="hint">Register an asset to see the first immutable entry.</span>
                                </motion.div>
                            ) : (
                                blocks.map((block) => (
                                    <motion.div
                                        key={block.hash}
                                        className="block-item glass"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="block-meta">
                                            <div className="block-number">
                                                <span className="label">Block</span>
                                                <span className="value">#{block.number}</span>
                                            </div>
                                            <div className="block-time">
                                                {new Date(block.timestamp * 1000).toLocaleTimeString()}
                                            </div>
                                        </div>

                                        <div className="block-details">
                                            <div className="detail-item">
                                                <span className="label">Hash</span>
                                                <span className="value mono">{formatAddress(block.hash)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Transactions</span>
                                                <span className="value">{block.transactions.length} txns</span>
                                            </div>
                                        </div>

                                        {block.transactions.length > 0 && (
                                            <div className="tx-preview">
                                                {block.transactions.slice(0, 3).map((tx, idx) => (
                                                    <div key={tx.hash || idx} className="tx-mini-card">
                                                        <span className={`tx-type ${tx.to?.toLowerCase() === contractData.address.toLowerCase() ? 'contract' : ''}`}>
                                                            {tx.to?.toLowerCase() === contractData.address.toLowerCase()
                                                                ? (getTransactionDesc(tx) || 'CONTRACT CALL')
                                                                : 'TRANSFER'}
                                                        </span>
                                                        <span className="tx-hash mono">{formatAddress(tx.hash)}</span>
                                                        <span className="tx-val">{ethers.formatEther(tx.value || 0)} ETH</span>
                                                    </div>
                                                ))}
                                                {block.transactions.length > 3 && (
                                                    <div className="more-tx">+{block.transactions.length - 3} more</div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockchainExplorer;
