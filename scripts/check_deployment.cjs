const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressPath = path.join(__dirname, "..", "frontend", "src", "contract-address.json");
    if (!fs.existsSync(addressPath)) {
        console.log("❌ contract-address.json not found!");
        return;
    }
    const { address: contractAddress } = JSON.parse(fs.readFileSync(addressPath, "utf8"));

    console.log("Checking contract at:", contractAddress);

    // Get code at address
    const code = await ethers.provider.getCode(contractAddress);

    if (code === "0x") {
        console.log("❌ NO CONTRACT DEPLOYED at this address!");
    } else {
        console.log("✅ Contract found at this address");
        console.log("Code length:", code.length, "bytes");

        // Try to interact with it
        const abi = [
            "function hasRole(bytes32 role, address account) public view returns (bool)"
        ];

        const contract = new ethers.Contract(contractAddress, abi, ethers.provider);
        const [signer] = await ethers.getSigners();

        try {
            const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
            const hasAdmin = await contract.hasRole(ADMIN_ROLE, signer.address);
            console.log("✅ Contract is responsive");
            console.log("Deployer address:", signer.address);
            console.log("Has admin role:", hasAdmin);
        } catch (error) {
            console.log("❌ Error calling contract:", error.message);
        }
    }
}

main().catch(console.error);
