import hre from "hardhat";

async function main() {
    console.log("🚀 Multi-Distributor Supply Chain Simulation\n");
    console.log("=".repeat(60));

    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    // Get signers (test accounts from Hardhat)
    const [deployer, factory, distributorA, distributorB, retailer, consumer] = await hre.ethers.getSigners();

    console.log("\n📋 Test Accounts:");
    console.log("  Factory:       ", factory.address);
    console.log("  Distributor A: ", distributorA.address, "(Global Shipping Co)");
    console.log("  Distributor B: ", distributorB.address, "(Local Courier)");
    console.log("  Retailer:      ", retailer.address, "(City Mall)");
    console.log("\n" + "=".repeat(60));

    // Attach to contract
    const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
    const contract = SupplyChain.attach(contractAddress);

    // Define roles
    const MANUFACTURER_ROLE = await contract.MANUFACTURER_ROLE();
    const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE();
    const RETAILER_ROLE = await contract.RETAILER_ROLE();

    // ========== STEP 1: Grant Roles ==========
    console.log("\n🎭 STEP 1: Granting Roles...");

    await contract.grantRole(MANUFACTURER_ROLE, factory.address);
    console.log("  ✅ Granted MANUFACTURER role to Factory");

    await contract.grantRole(DISTRIBUTOR_ROLE, distributorA.address);
    console.log("  ✅ Granted DISTRIBUTOR role to Distributor A");

    await contract.grantRole(DISTRIBUTOR_ROLE, distributorB.address);
    console.log("  ✅ Granted DISTRIBUTOR role to Distributor B");

    await contract.grantRole(RETAILER_ROLE, retailer.address);
    console.log("  ✅ Granted RETAILER role to Retailer");

    // ========== STEP 2: Create Product ==========
    console.log("\n🏭 STEP 2: Manufacturing Product...");

    const secretCode = "VERIFY-2024-SECRET";
    const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(secretCode));

    const createTx = await contract.connect(factory).createProduct(
        "Premium Wireless Headphones",
        "BATCH-WH-2024-12",
        secretHash
    );
    const createReceipt = await createTx.wait();

    // Parse ProductCreated event to get ID
    const createdEvent = createReceipt.logs.find(log => {
        try {
            const parsed = contract.interface.parseLog(log);
            return parsed && parsed.name === "ProductCreated";
        } catch { return false; }
    });

    const productId = contract.interface.parseLog(createdEvent).args.id;
    console.log(`  ✅ Product created with ID: ${productId}`);
    console.log(`  📝 Product Name: Premium Wireless Headphones`);
    console.log(`  📦 Batch ID: BATCH-WH-2024-12`);
    console.log(`  🔐 Secret Code (for verification): ${secretCode}`);

    // ========== STEP 3: Transfer to Distributor A ==========
    console.log("\n🚚 STEP 3: Transfer to Distributor A (Global Shipping)...");

    await contract.connect(factory).transferCustody(
        productId,
        distributorA.address,
        "Factory Warehouse, Shanghai, China",
        "Shipment dispatched via cargo flight CA-1234"
    );
    console.log("  ✅ Transferred to Global Shipping Co");
    console.log("  📍 Location: Shanghai, China");
    console.log("  📝 Note: Shipment dispatched via cargo flight");

    // ========== STEP 4: Transfer to Distributor B ==========
    console.log("\n🚛 STEP 4: Transfer to Distributor B (Local Courier)...");

    await contract.connect(distributorA).transferCustody(
        productId,
        distributorB.address,
        "Regional Distribution Center, Mumbai, India",
        "Received at regional hub for last-mile delivery"
    );
    console.log("  ✅ Transferred to Local Courier");
    console.log("  📍 Location: Mumbai, India");
    console.log("  📝 Note: Received at regional hub");

    // ========== STEP 5: Transfer to Retailer ==========
    console.log("\n🏪 STEP 5: Transfer to Retailer (City Mall)...");

    await contract.connect(distributorB).transferCustody(
        productId,
        retailer.address,
        "City Mall Electronics Store, Bangalore, India",
        "Delivered and verified, placed in inventory"
    );
    console.log("  ✅ Transferred to City Mall");
    console.log("  📍 Location: Bangalore, India");
    console.log("  📝 Note: Delivered and placed in inventory");

    // ========== STEP 6: Fetch and Display Journey ==========
    console.log("\n📊 PRODUCT JOURNEY SUMMARY");
    console.log("=".repeat(60));

    const product = await contract.getProduct(productId);
    const history = await contract.getHistory(productId);

    console.log(`\nProduct ID: ${productId}`);
    console.log(`Current State: ${["Created", "In Transit", "At Retailer", "Sold", "Consumed", "Stolen", "Disputed"][product.state]}`);
    console.log(`Current Owner: ${product.currentOwner}`);
    console.log(`\n🗺️  Complete Journey (${history.length} events):\n`);

    history.forEach((event, index) => {
        const date = new Date(Number(event.timestamp) * 1000).toLocaleString();
        const statusNames = ["Created", "In Transit", "At Retailer", "Sold", "Consumed", "Stolen", "Disputed"];
        const statusEmojis = ["🏭", "🚚", "🏪", "🛒", "✅", "🚨", "⚠️"];

        console.log(`${index + 1}. ${statusEmojis[event.status]} ${statusNames[event.status]}`);
        console.log(`   📅 ${date}`);
        console.log(`   📍 ${event.location}`);
        console.log(`   👤 Handler: ${event.handler}`);
        console.log(`   📝 ${event.note}`);
        if (index < history.length - 1) console.log(`   |`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("\n✨ SUCCESS! Multi-distributor flow completed!");
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Open your React app at http://localhost:3000`);
    console.log(`   2. Navigate to the "Trace" page`);
    console.log(`   3. Enter Product ID: ${productId}`);
    console.log(`   4. You should see all ${history.length} events in the timeline!`);
    console.log(`   5. Try verifying with secret code: ${secretCode}`);
    console.log("\n" + "=".repeat(60));
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exitCode = 1;
});
