const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const SupplyChain = await hre.ethers.getContractAt("SupplyChain", contractAddress);
  
  try {
    const productName = "Test Item " + Date.now();
    const secretCode = "SECRET";
    const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(secretCode));
    
    console.log("Creating product...");
    const tx = await SupplyChain.createProduct(productName, secretHash);
    await tx.wait();
    console.log("Product created.");
    
    // In Solidity counter is private, but we can try to get product 1, 2, 3...
    for(let i=1; i<=10; i++) {
        const p = await SupplyChain.getProduct(i);
        if (p.exists) {
            console.log(`Found Product ID: ${i}, Name: ${p.name}`);
        }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
