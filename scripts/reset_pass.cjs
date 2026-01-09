const hre = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const distributorAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const SupplyChain = await hre.ethers.getContractAt("SupplyChain", contractAddress);

    const targetPass = "8A3NGA2C";
    const targetHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(targetPass));

    console.log(`Setting pass for Product #1 to: ${targetPass}`);

    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [distributorAddress],
    });

    const signer = await hre.ethers.getSigner(distributorAddress);
    const contractWithSigner = SupplyChain.connect(signer);

    const tx = await contractWithSigner.generateHandover(1, targetHash);
    await tx.wait();
    console.log("Success! Pass updated on-chain.");

    const p = await SupplyChain.getProduct(1);
    console.log("Current Handover Hash:", p.currentHandoverHash);
}

main().catch(console.error);
