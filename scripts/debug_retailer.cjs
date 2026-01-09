const hre = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const retailerAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const SupplyChain = await hre.ethers.getContractAt("SupplyChain", contractAddress);

    const RETAILER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RETAILER"));
    const DISTRIBUTOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DISTRIBUTOR"));
    const MANUFACTURER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MANUFACTURER"));

    console.log("Checking roles for:", retailerAddress);
    
    const isRetailer = await SupplyChain.hasRole(RETAILER_ROLE, retailerAddress);
    const isDistributor = await SupplyChain.hasRole(DISTRIBUTOR_ROLE, retailerAddress);
    const isManufacturer = await SupplyChain.hasRole(MANUFACTURER_ROLE, retailerAddress);

    console.log("Is Retailer:", isRetailer);
    console.log("Is Distributor:", isDistributor);
    console.log("Is Manufacturer:", isManufacturer);

    // Check first 5 products
    for (let i = 1; i <= 5; i++) {
        try {
            const p = await SupplyChain.getProduct(i);
            if (p.exists) {
                console.log(`Product #${i}: ${p.name}`);
                console.log(`  Owner: ${p.currentOwner}`);
                console.log(`  State: ${p.state}`);
                console.log(`  Handover Hash: ${p.currentHandoverHash}`);
            }
        } catch (e) {
            // Ignore if out of range
        }
    }
}

main().catch(console.error);
