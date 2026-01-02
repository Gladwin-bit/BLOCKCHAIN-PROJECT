import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const sc = await SupplyChain.deploy();
  await sc.waitForDeployment();

  const address = await sc.getAddress();
  console.log("SupplyChain deployed to:", address);

  // Save to frontend to avoid manual copy-paste errors
  const addressPath = path.join(process.cwd(), "frontend", "src", "contract-address.json");
  fs.writeFileSync(addressPath, JSON.stringify({ address }, null, 2));
  console.log("Address saved to:", addressPath);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
