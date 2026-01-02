const hre = require("hardhat");

async function main() {
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const Contract = await hre.ethers.getContractFactory("SupplyChain");
    const contract = await Contract.attach(contractAddress);

    const id = 1;
    console.log(`Checking Product ${id}...`);

    try {
        const p = await contract.getProduct(id);
        console.log("Product Data Raw:", p);

        // Access properties
        console.log("ID:", p.id.toString());
        console.log("Name:", p.name);
        console.log("State:", p.state); // Structs usually return BigInt for uint/enum

        const history = await contract.getHistory(id);
        console.log("History Data Raw:", history);

        if (history.length > 0) {
            console.log("First Event Handler:", history[0].handler);
        }

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
