import hre from "hardhat";

async function main() {
  const lotId = process.argv[2];
  if (!lotId) {
    console.error("❌ Please provide a lotId to trace. Usage: npx hardhat run scripts/trace.js <lotId>");
    process.exit(1);
  }

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const sc = await SupplyChain.attach(contractAddress);

  try {
    const lot = await sc.getLot(lotId);

    const lotIdNumber = Number(lot.id);
    if (lotIdNumber === 0) {
      console.error(`Lot ${lotId} does not exist!`);
      return;
    }

    console.log(`✅ Lot ${lotId} details:`);
    console.log(`Product: ${lot.product}`);
    console.log(`Batch: ${lot.batch}`);
    console.log(`Quantity: ${lot.quantity}`);
    console.log(`Company: ${lot.company}`);
    console.log(`Procedures recorded: ${lot.procCount}`);

    const procCount = Number(lot.procCount);
    if (procCount > 0) {
      console.log(`\nProcedures:`);
      for (let i = 0; i < procCount; i++) {
        const p = await sc.getLotProcedure(lotId, i);
        console.log(`- ${p.procId}: ${p.info} (by ${p.actor} at ${new Date(p.timestamp * 1000)})`);
      }
    }
  } catch (error) {
    if (error.message.includes("lot not exist")) {
      console.error(`Error: Lot ${lotId} does not exist in contract.`);
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
