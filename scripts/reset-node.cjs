const { network } = require("hardhat");

async function main() {
    console.log("Requesting full Hardhat node reset...");
    await network.provider.send("hardhat_reset");
    console.log("Blockchain has been reset to Block #0.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
