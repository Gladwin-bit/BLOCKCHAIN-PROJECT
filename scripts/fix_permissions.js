import hre from "hardhat";

async function main() {
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const targetUser = "0x2546BcD3c84621e976D8185a91A922aE77ECEc30";

    console.log(`Granting ADMIN role to ${targetUser}...`);

    const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
    const contract = SupplyChain.attach(contractAddress);

    // Default Admin Role is 0x00...
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

    // The deployer (Account #0) usually has the admin role
    const [deployer] = await hre.ethers.getSigners();
    console.log("Acting as deployer:", deployer.address);

    const tx = await contract.grantRole(DEFAULT_ADMIN_ROLE, targetUser);
    await tx.wait();

    console.log("✅ Role Granted Successfully");

    // Verify
    const hasRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, targetUser);
    console.log("Verification - User has Admin role:", hasRole);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
