const hre = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const retailerAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const SupplyChain = await hre.ethers.getContractAt("SupplyChain", contractAddress);

    const RETAILER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RETAILER"));

    const [admin] = await hre.ethers.getSigners();
    console.log("Admin address:", admin.address);

    console.log(`Granting RETAILER_ROLE to ${retailerAddress}...`);
    const tx = await SupplyChain.grantRole(RETAILER_ROLE, retailerAddress);
    await tx.wait();
    console.log("Role granted!");

    const hasRole = await SupplyChain.hasRole(RETAILER_ROLE, retailerAddress);
    console.log("Verification - Has RETAILER_ROLE:", hasRole);
}

main().catch(console.error);
