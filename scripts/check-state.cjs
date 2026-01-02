const { ethers } = require("hardhat");
const contractData = require("../frontend/src/contract-address.json");

async function main() {
    const address = contractData.address;
    console.log("Checking contract at:", address);
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const contract = await SupplyChain.attach(address);

    console.log("Checking first 10 IDs...");
    for (let i = 1; i <= 10; i++) {
        try {
            const p = await contract.getProduct(i);
            if (p.exists) {
                console.log(`Product #${i}: ${p.name} (owner: ${p.currentOwner})`);
            }
        } catch (e) {
            // console.log("Error fetching ID " + i, e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
