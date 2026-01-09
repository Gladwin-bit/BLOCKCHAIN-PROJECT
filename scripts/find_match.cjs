const hre = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const SupplyChain = await hre.ethers.getContractAt("SupplyChain", contractAddress);

    const targetPass = "8A3NGA2C";
    const targetHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(targetPass));
    console.log(`Searching for products matching pass: ${targetPass}`);
    console.log(`Target Hash: ${targetHash}`);

    for (let i = 1; i <= 20; i++) {
        try {
            const p = await SupplyChain.getProduct(i);
            if (p.exists) {
                const match = p.currentHandoverHash === targetHash;
                console.log(`ID: ${i}, Msg: ${p.name}, Owner: ${p.currentOwner}, State: ${p.state}, Hash: ${p.currentHandoverHash}, Match: ${match}`);
            }
        } catch (e) {
            // Probably end of products
        }
    }
}

main().catch(console.error);
