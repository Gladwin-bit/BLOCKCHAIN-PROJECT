import hre from "hardhat";

async function main() {
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
    const contract = SupplyChain.attach(contractAddress);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Test creating a product
    const productName = "Test Product";
    const secretCode = "test123";
    const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(secretCode));

    console.log("\nCreating product...");
    console.log("Product Name:", productName);
    console.log("Secret Hash:", secretHash);

    try {
        const tx = await contract.createProduct(productName, secretHash);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed!");

        // Find the ProductCreated event
        const event = receipt.logs
            .map(log => {
                try {
                    return contract.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .find(log => log && log.name === "ProductCreated");

        if (event) {
            console.log("✅ Product created successfully!");
            console.log("Product ID:", event.args.id.toString());
            console.log("Manufacturer:", event.args.manufacturer);
            console.log("Name:", event.args.name);
        }
    } catch (error) {
        console.error("❌ Error creating product:");
        console.error(error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
