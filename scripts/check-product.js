const { ethers } = require("ethers");

async function checkProduct() {
    // Connect to local Hardhat network
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Contract address from deployment
    const contractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

    // Load ABI
    const SupplyChain = require("../artifacts/contracts/SupplyChain.sol/SupplyChain.json");

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, SupplyChain.abi, provider);

    try {
        // Get product #1
        const product = await contract.getProduct(1);

        console.log("\n=== Product #1 Details ===");
        console.log("ID:", product.id.toString());
        console.log("Name:", product.name);
        console.log("Current Owner:", product.currentOwner);
        console.log("State:", product.state.toString());
        console.log("Consumer Secret Hash:", product.consumerSecretHash);
        console.log("Current Handover Hash:", product.currentHandoverHash);
        console.log("Is Consumed:", product.isConsumed);
        console.log("Exists:", product.exists);

        // Test the scratch code
        const testCode = "5DB4-C0D6-443B-DA7E";
        const testHash = ethers.keccak256(ethers.toUtf8Bytes(testCode));
        console.log("\n=== Verification Test ===");
        console.log("Test Code:", testCode);
        console.log("Test Hash:", testHash);
        console.log("Matches Consumer Secret?", product.consumerSecretHash === testHash);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkProduct();
