const hre = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const SupplyChain = await hre.ethers.getContractAt("SupplyChain", contractAddress);

    const productId = 1;

    console.log(`Checking logs for Product #${productId}...`);

    const filterHandover = SupplyChain.filters.HandoverGenerated(productId);
    const eventsHandover = await SupplyChain.queryFilter(filterHandover);
    console.log(`HandoverGenerated events: ${eventsHandover.length}`);
    eventsHandover.forEach(e => {
        console.log(`  Block ${e.blockNumber}: From ${e.args.from}`);
    });

    const filterCustody = SupplyChain.filters.CustodyTransferred(productId);
    const eventsCustody = await SupplyChain.queryFilter(filterCustody);
    console.log(`CustodyTransferred events: ${eventsCustody.length}`);
    eventsCustody.forEach(e => {
        console.log(`  Block ${e.blockNumber}: From ${e.args.from} To ${e.args.to} Loc: ${e.args.location}`);
    });

    const p = await SupplyChain.getProduct(productId);
    console.log("Current Handover Hash:", p.currentHandoverHash);
}

main().catch(console.error);
