const hre = require("hardhat");

async function main() {
    const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Current deployment
    const userAddress = "0x2546Bcd3c84621e976D8185a91A922aE77ECec30".toLowerCase(); // Lowercase to pass checksum check

    const Contract = await hre.ethers.getContractFactory("SupplyChain");
    const contract = await Contract.attach(contractAddress);

    // Get Distributor Role Hash
    const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE();

    console.log(`Granting DISTRIBUTOR_ROLE to ${userAddress}...`);

    // Account[0] (Deployer/Admin) grants the role
    const tx = await contract.grantRole(DISTRIBUTOR_ROLE, userAddress);
    await tx.wait();

    console.log("Role granted successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
