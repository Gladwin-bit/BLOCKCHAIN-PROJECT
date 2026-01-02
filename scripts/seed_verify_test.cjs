const hre = require("hardhat");

async function main() {
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const [deployer] = await hre.ethers.getSigners();
  
  const SupplyChain = await hre.ethers.getContractAt("SupplyChain", contractAddress);
  
  const productName = "Premium Rolex Watch";
  const secretCode = "VERIFY_TEST_2025";
  const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(secretCode));
  
  console.log("Seeding test product...");
  
  try {
    const tx = await SupplyChain.createProduct(productName, secretHash);
    const receipt = await tx.wait();
    
    // Find ProductCreated event
    const event = receipt.logs.find(log => {
        try {
            return SupplyChain.interface.parseLog(log).name === 'ProductCreated';
        } catch(e) { return false; }
    });
    
    if (!event) {
        throw new Error("ProductCreated event not found in logs");
    }

    const productId = SupplyChain.interface.parseLog(event).args.id;
    
    console.log("-----------------------------------");
    console.log("Test Product Created Successfully!");
    console.log(`Product ID: ${productId}`);
    console.log(`Name: ${productName}`);
    console.log(`Verification Secret: ${secretCode}`);
    console.log("-----------------------------------");
    
  } catch (error) {
    console.error("Error seeding product:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
