const { ethers } = require("hardhat");
const contractData = require("./frontend/src/contract-address.json");

async function main() {
    const address = contractData.address;
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const contract = await SupplyChain.attach(address);

    const count = await contract.productCount();
    console.log("Current Product Count:", count.toString());

    if (count > 0) {
        for (let i = 1; i <= count; i++) {
            const p = await contract.getProduct(i);
            console.log(`Product #${i}: ${p.name} (exists: ${p.exists}, owner: ${p.currentOwner})`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
