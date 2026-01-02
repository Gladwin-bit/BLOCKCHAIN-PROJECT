import hre from "hardhat";

async function main() {
    const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const userAddress = "0x2546BcD3c84621e976D8185a91A922aE77ECEc30"; // The user's address from the screenshot

    const Contract = await hre.ethers.getContractFactory("SupplyChain");
    const contract = await Contract.attach(contractAddress);

    // DEFAULT_ADMIN_ROLE is 0x00...00
    const ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();

    console.log(`Granting DEFAULT_ADMIN_ROLE to ${userAddress}...`);

    // This transaction must be sent by the current admin (the deployer, Account #0)
    const tx = await contract.grantRole(ADMIN_ROLE, userAddress);
    await tx.wait();

    console.log("Admin role granted successfully!");

    // Verify
    const hasRole = await contract.hasRole(ADMIN_ROLE, userAddress);
    console.log(`Has Admin Role: ${hasRole}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
