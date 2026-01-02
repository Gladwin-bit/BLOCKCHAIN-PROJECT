import hre from "hardhat";

async function main() {
    const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const userAddress = "0x2546BcD3c84621e976D8185a91A922aE77ECEc30";

    const Contract = await hre.ethers.getContractFactory("SupplyChain");
    const contract = await Contract.attach(contractAddress);

    // Get the MANUFACTURER_ROLE hash
    const MANUFACTURER_ROLE = await contract.MANUFACTURER_ROLE();

    console.log(`Granting MANUFACTURER_ROLE to ${userAddress}...`);

    // The deployer (Account #0) usually has the DEFAULT_ADMIN_ROLE and can grant roles
    const tx = await contract.grantRole(MANUFACTURER_ROLE, userAddress);
    await tx.wait();

    console.log("Role granted successfully!");

    // Verify
    const hasRole = await contract.hasRole(MANUFACTURER_ROLE, userAddress);
    console.log(`Has Role: ${hasRole}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
