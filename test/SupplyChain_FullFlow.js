import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("SupplyChain Advanced Lifecycle", function () {
    let supplyChain;
    let manufacturer, handler, consumer;
    const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER"));
    const secretCode = "Pass123";
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secretCode));

    beforeEach(async function () {
        [manufacturer, handler, consumer] = await ethers.getSigners();
        const SupplyChain = await ethers.getContractFactory("SupplyChain");
        supplyChain = await SupplyChain.deploy();
        await supplyChain.waitForDeployment();

        // Grant roles
        await supplyChain.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    });

    it("Should complete the Phase 1: B2B Handshake", async function () {
        // 1. Create Product
        await supplyChain.connect(manufacturer).createProduct("Premium Watch", secretHash);

        // 2. Offer Custody
        await supplyChain.connect(manufacturer).offerCustody(1, handler.address);
        expect(await supplyChain.pendingOwners(1)).to.equal(handler.address);

        // 3. Accept Custody (Non-intended receiver should fail)
        await expect(
            supplyChain.connect(consumer).acceptCustody(1, "Warehouse A")
        ).to.be.revertedWith("Security: Caller is not the intended receiver");

        // 4. Accept Custody (Intended handler)
        await supplyChain.connect(handler).acceptCustody(1, "Warehouse A");
        const product = await supplyChain.getProduct(1);
        expect(product.currentOwner).to.equal(handler.address);
        expect(product.state).to.equal(1n); // InTransit (BigInt in ethers v6)
    });

    it("Should complete the Phase 2: Consumer Claim", async function () {
        await supplyChain.connect(manufacturer).createProduct("Premium Watch", secretHash);

        // Set state to AtRetailer for claim
        const RETAILER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RETAILER"));
        await supplyChain.grantRole(RETAILER_ROLE, handler.address);

        await supplyChain.connect(manufacturer).offerCustody(1, handler.address);
        await supplyChain.connect(handler).acceptCustody(1, "Retail Store 7");

        // 1. Claim with wrong code should fail
        await expect(
            supplyChain.connect(consumer).claimProduct(1, "WrongCode")
        ).to.be.revertedWith("Security: Invalid secret code provided");

        // 2. Claim with correct code
        await supplyChain.connect(consumer).claimProduct(1, secretCode);
        const product = await supplyChain.getProduct(1);
        expect(product.currentOwner).to.equal(consumer.address);
        expect(product.state).to.equal(3n); // Sold
    });
});
