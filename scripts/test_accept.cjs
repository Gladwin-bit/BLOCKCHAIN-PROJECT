const hre = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const retailerAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const SupplyChain = await hre.ethers.getContractAt("SupplyChain", contractAddress);

    // Impersonate the retailer address
    // Note: This only works if the Hardhat node supports it (it should if it's a standard hardhat node)
    try {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [retailerAddress],
        });

        // Give some ETH to the retailer account so it can pay for gas
        const [admin] = await hre.ethers.getSigners();
        await admin.sendTransaction({
            to: retailerAddress,
            value: hre.ethers.parseEther("1.0"),
        });

        const impersonatedSigner = await hre.ethers.getSigner(retailerAddress);
        const contractWithSigner = SupplyChain.connect(impersonatedSigner);

        const productId = 1;
        const secretKey = "8A3NGA2C";
        const nextSecret = "NEXT_SECRET";
        const nextHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(nextSecret));
        const location = "KANHANGAD";

        console.log(`Calling acceptHandover for Product #${productId}...`);
        console.log(`  Account: ${retailerAddress}`);
        console.log(`  Pass: ${secretKey}`);
        console.log(`  Location: ${location}`);

        try {
            const tx = await contractWithSigner.acceptHandover(productId, secretKey, nextHash, location);
            const receipt = await tx.wait();
            console.log("SUCCESS! Transaction mined in block", receipt.blockNumber);
        } catch (e) {
            console.error("FAILED with error:");
            console.error(e);
            if (e.data) console.log("Error Data:", e.data);
        }

    } catch (err) {
        console.error("Setup error (maybe impersonation not supported):", err.message);
    }
}

main().catch(console.error);
