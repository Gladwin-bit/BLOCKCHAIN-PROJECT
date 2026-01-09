const { ethers } = require("ethers");

async function debugProduct() {
    // Connect to local Hardhat network
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Contract address
    const contractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

    // Load ABI
    const SupplyChain = require("../artifacts/contracts/SupplyChain.sol/SupplyChain.json");

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, SupplyChain.abi, provider);

    try {
        // Get product #3
        const product = await contract.getProduct(3);

        console.log("\n=== Product #3 Details ===");
        console.log("ID:", product.id.toString());
        console.log("Name:", product.name);
        console.log("Current Owner:", product.currentOwner);
        console.log("Current Handover Hash:", product.currentHandoverHash);

        // Test various keys
        const testKeys = ["TRNF2SVM", "52U8WV4Z", "trnf2svm", "TRNF2SVM"];

        console.log("\n=== Testing Keys ===");
        for (const key of testKeys) {
            const hash = ethers.keccak256(ethers.toUtf8Bytes(key));
            const matches = hash === product.currentHandoverHash;
            console.log(`Key: "${key}"`);
            console.log(`  Hash: ${hash}`);
            console.log(`  Matches: ${matches ? "✅ YES" : "❌ NO"}`);
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugProduct();
