import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import contractData from "../contract-address.json";
import SupplyChainArtifact from "../SupplyChain.json";

const SupplyChainContext = createContext();

const contractAddress = contractData.address;
const abi = SupplyChainArtifact.abi;

export const ROLES = {
    ADMIN: "0x0000000000000000000000000000000000000000000000000000000000000000",
    MANUFACTURER: ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER")),
    DISTRIBUTOR: ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR")),
    RETAILER: ethers.keccak256(ethers.toUtf8Bytes("RETAILER"))
};

export const PRODUCT_STATES = ["Created", "In Transit", "At Retailer", "Sold", "In Transit P2P"];


// Standard hook for accessing context directly
export const useSupplyChainContext = () => {
    const context = useContext(SupplyChainContext);
    if (!context) throw new Error("useSupplyChainContext must be used within SupplyChainProvider");
    return context;
};

// Aliased hook for backward compatibility if needed
export const useSupplyChain = useSupplyChainContext;

export const SupplyChainProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [readOnlyContract, setReadOnlyContract] = useState(null);

    useEffect(() => {
        const initReadOnly = async () => {
            try {
                let provider;
                if (window.ethereum) {
                    provider = new ethers.BrowserProvider(window.ethereum);
                } else {
                    provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
                }
                const sc = new ethers.Contract(contractAddress, abi, provider);
                setReadOnlyContract(sc);
            } catch (e) {
                console.warn("Read-only contract init failed", e);
            }
        };
        initReadOnly();
    }, []);

    const updateConnection = useCallback((addr, signer) => {
        setAccount(addr);
        const normalizedAddress = ethers.getAddress(contractAddress);
        const sc = new ethers.Contract(normalizedAddress, abi, signer);
        setContract(sc);
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error("MetaMask not detected");
            return null;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum, "any");
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const addr = await signer.getAddress();
            updateConnection(addr, signer);
            return addr;
        } catch (e) {
            console.error(e);
            toast.error("Failed to connect wallet");
            return null;
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            const handleAccounts = (accounts) => {
                if (accounts.length > 0) {
                    connectWallet();
                } else {
                    setAccount(null);
                    setContract(null);
                }
            };
            window.ethereum.on("accountsChanged", handleAccounts);
            window.ethereum.on("chainChanged", () => window.location.reload());
            return () => {
                window.ethereum.removeListener("accountsChanged", handleAccounts);
            };
        }
    }, [updateConnection]);

    const createProduct = async (name, secretCode, productCertificate = "") => {
        if (!contract) throw new Error("Wallet not connected");
        const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secretCode));
        toast.info("Initiating Product on Ledger...");
        const tx = await contract.createProduct(name, secretHash, productCertificate);
        const receipt = await tx.wait();
        const event = receipt.logs
            .map(log => { try { return contract.interface.parseLog(log); } catch (e) { return null; } })
            .find(log => log && log.name === "ProductCreated");
        if (!event) throw new Error("Event 'ProductCreated' not found");
        const productId = event.args.id.toString();
        toast.success(`Product #${productId} minted!`);
        return productId;
    };

    const getProductData = async (id) => {
        const targetContract = contract || readOnlyContract;
        if (!targetContract) throw new Error("Initializing blockchain provider...");

        const p = await targetContract.getProduct(id);
        if (!p.exists) throw new Error("Item not found on ledger (ID does not exist)");

        const [h, v, vl] = await Promise.all([
            targetContract.getHistory(id),
            targetContract.getVerificationHistory(id),
            targetContract.verifyLog(id)
        ]);


        return {
            id: p.id.toString(),
            name: p.name,
            currentOwner: p.currentOwner,
            state: PRODUCT_STATES[p.state],
            stateRaw: p.state,
            currentSecretHash: p.currentSecretHash,
            currentHandoverHash: p.currentHandoverHash,
            customerClaim: (p.customerClaim && p.customerClaim.isClaimed) ? {
                customerName: p.customerClaim.customerName,
                location: p.customerClaim.location,
                timestamp: new Date(Number(p.customerClaim.timestamp) * 1000).toLocaleString(),
                claimedBy: p.customerClaim.claimedBy,
                isClaimed: p.customerClaim.isClaimed
            } : null,
            verifyLog: vl.time > 0 ? {
                verifier: vl.verifier,
                time: new Date(Number(vl.time) * 1000).toLocaleString(),
                isFirstClaim: vl.isFirstClaim
            } : null,
            history: h.map(entry => ({
                actor: entry.actor,
                state: PRODUCT_STATES[entry.state],
                timestamp: new Date(Number(entry.timestamp) * 1000).toLocaleString(),
                location: entry.location
            })),
            verifications: v.map(entry => ({
                verifier: entry.verifier,
                timestamp: new Date(Number(entry.timestamp) * 1000).toLocaleString(),
                location: entry.location,
                remarks: entry.remarks
            }))
        };
    };

    const hasRole = async (role, address) => {
        if (!contract && !readOnlyContract) return false;
        const target = contract || readOnlyContract;
        return await target.hasRole(ROLES[role] || role, address);
    };

    return (
        <SupplyChainContext.Provider value={{
            account, connectWallet, createProduct, getProductData, hasRole,
            contract, readOnlyContract, ROLES, PRODUCT_STATES
        }}>
            {children}
        </SupplyChainContext.Provider>
    );
};
