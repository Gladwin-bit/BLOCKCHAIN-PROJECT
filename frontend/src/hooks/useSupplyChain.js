// VERSION: 3.4 - Cleaned up duplicates, using context logic
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useSupplyChainContext } from "../context/SupplyChainContext";

export const useSupplyChain = () => {
    const context = useSupplyChainContext();
    const {
        account, contract, readOnlyContract, connectWallet,
        createProduct, getProductData, hasRole,
        ROLES, PRODUCT_STATES
    } = context;

    const generateHandover = async (id, newSecretCode) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        const newHash = ethers.keccak256(ethers.toUtf8Bytes(newSecretCode));
        toast.info("Generating Secure Handover Pass...");
        const tx = await contract.generateHandover(id, newHash);
        await tx.wait();
        toast.success("Handover Pass Generated! 🎟️");
    };

    const acceptHandover = async (id, scannedSecret, nextSecretCode, location) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        const nextHash = ethers.keccak256(ethers.toUtf8Bytes(nextSecretCode));
        toast.info("Validating Code & Rolling Protocol...");
        const tx = await contract.acceptHandover(id, scannedSecret, nextHash, location);
        await tx.wait();
        toast.success("Custody Accepted & Protocol Rolled! 🔄");
    };

    const updateSecret = async (id, newSecretCode) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        const newHash = ethers.keccak256(ethers.toUtf8Bytes(newSecretCode));
        toast.info("Updating Secret Key Hash...");
        const tx = await contract.updateSecret(id, newHash);
        await tx.wait();
        toast.success("Secret Hash Updated on Blockchain! 🔐");
    };

    const verifyAndClaim = async (id, secretKey) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        toast.info("Verifying Secret & Claiming Authenticity...");
        const tx = await contract.verifyAndClaim(id, secretKey);
        const receipt = await tx.wait();

        const claimedEvent = receipt.logs.some(log => {
            try { return contract.interface.parseLog(log).name === "ProductClaimed"; } catch (e) { return false; }
        });

        if (claimedEvent) {
            toast.success("SUCCESS: Authenticity Verified & Ownership Claimed! 🎉");
            return { status: "claimed" };
        } else {
            toast.info("Authenticity Verified! Showing History Log.");
            return { status: "reverified" };
        }
    };

    const claimProduct = async (id, secretCode) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        toast.info("Performing Cryptographic Handshake...");
        const tx = await contract.claimProduct(id, secretCode);
        await tx.wait();
        toast.success("Authenticity Verified & Ownership Swapped! 🛡️");
    };

    const transferOwnership = async (id, toAddress) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        toast.info("Recording Peer-to-Peer Ownership Swap...");
        const tx = await contract.transferOwnership(id, toAddress);
        await tx.wait();
        toast.success("P2P Ownership Transfer Complete! 🔄");
    };

    const recordVerification = async (id, location, remarks) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        toast.info("Signing Digital Guestbook...");
        const tx = await contract.recordVerification(id, location, remarks);
        await tx.wait();
        toast.success("Verification Recorded on Blockchain! ✅");
    };

    const claimCustomerOwnership = async (id, secretKey, customerName, location) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        toast.info("Claiming product ownership...");
        const tx = await contract.claimCustomerOwnership(id, secretKey, customerName, location);
        const receipt = await tx.wait();

        const claimedEvent = receipt.logs.some(log => {
            try { return contract.interface.parseLog(log).name === "CustomerOwnershipClaimed"; } catch (e) { return false; }
        });

        if (claimedEvent) {
            toast.success("SUCCESS: Ownership Claimed! 🎉");
            return { status: "claimed" };
        } else {
            toast.error("Claim failed");
            return { status: "failed" };
        }
    };

    const grantRole = async (role, address) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        toast.info("Granting Role...");
        const tx = await contract.grantRole(ROLES[role] || role, address);
        await tx.wait();
        toast.success("Role Granted Successfully! 👑");
    };

    const revokeRole = async (role, address) => {
        if (!contract) throw new Error("Connection: Wallet not connected");
        toast.info("Revoking Role...");
        const tx = await contract.revokeRole(ROLES[role] || role, address);
        await tx.wait();
        toast.error("Role Revoked! 🛑");
    };

    return {
        account, connectWallet, contract, readOnlyContract,
        createProduct, generateHandover, acceptHandover, claimProduct, transferOwnership,
        getProductData, hasRole, grantRole, revokeRole, recordVerification,
        updateSecret, verifyAndClaim, claimCustomerOwnership,
        ROLES, PRODUCT_STATES
    };
};

export { ROLES, PRODUCT_STATES } from "../context/SupplyChainContext";
