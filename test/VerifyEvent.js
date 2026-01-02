import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("SupplyChain Event Test", function () {
    it("Should emit ProductCreated event on product creation", async function () {
        const SupplyChain = await ethers.getContractFactory("SupplyChain");
        const supplyChain = await SupplyChain.deploy();
        await supplyChain.waitForDeployment();

        const [owner] = await ethers.getSigners();

        // Create product (name, secretHash)
        const tx = await supplyChain.createProduct(
            "Test Product",
            ethers.ZeroHash
        );
        const receipt = await tx.wait();

        // Check logs
        let eventFound = false;
        for (const log of receipt.logs) {
            try {
                const parsed = supplyChain.interface.parseLog(log);
                if (parsed && parsed.name === "ProductCreated") {
                    console.log("Event found:", parsed.name);
                    console.log("Args:", parsed.args);
                    expect(parsed.args.name).to.equal("Test Product");
                    eventFound = true;
                    break;
                }
            } catch (e) {
                // ignore
            }
        }
        expect(eventFound).to.be.true;
    });
});
