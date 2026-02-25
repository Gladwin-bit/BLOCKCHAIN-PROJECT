import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supplychain';

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('📦 Connected to MongoDB at', MONGODB_URI);

        // --- 1. Seed Users ---
        console.log('👤 Seeding Users...');

        // Clear existing users with these emails to avoid duplicates
        const testEmails = ['manufacturer@test.com', 'distributor@test.com', 'retailer@test.com', 'customer@test.com'];
        await User.deleteMany({ email: { $in: testEmails } });

        const passwordHash = await bcrypt.hash('password123', 10);

        const users = await User.insertMany([
            {
                name: 'Global Manufacturing Co.',
                email: 'manufacturer@test.com',
                password: passwordHash, // We bypass pre-save hook with insertMany, so hash manually or use create
                role: 'manufacturer',
                isVerified: true,
                walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
            },
            {
                name: 'FastLane Logistics',
                email: 'distributor@test.com',
                password: passwordHash,
                role: 'distributor',
                isVerified: true,
                walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
            },
            {
                name: 'City Supermarket',
                email: 'retailer@test.com',
                password: passwordHash,
                role: 'retailer',
                isVerified: true,
                walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
            },
            {
                name: 'John Doe (Consumer)',
                email: 'customer@test.com',
                password: passwordHash,
                role: 'customer',
                isVerified: true,
                walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
            }
        ]);

        console.log(`✅ Created ${users.length} Users`);
        const manufacturerId = users[0]._id; // Use the manufacturer for products

        // --- 2. Seed Products ---
        console.log('📦 Seeding Products (DataCo Dataset Model)...');

        // Clear existing products in ID range 100-111
        await Product.deleteMany({ productId: { $gte: 100, $lte: 120 } });

        const productsData = [
            { id: 100, name: "Rolex Submariner Date" },
            { id: 101, name: "Cocoa Beans Batch-001 (Organic)" },
            { id: 102, name: "Automotive ECU Chipset X5" },
            { id: 103, name: "Pharma Vaccine Batch-V22" },
            { id: 104, name: "Nike Air Jordan 1 High" },
            { id: 105, name: "Sony PlayStation 5 Console" },
            { id: 106, name: "Samsung Galaxy S24 Ultra" },
            { id: 107, name: "Organic Arabica Coffee Beans" },
            { id: 108, name: "Tesla Model 3 Brake Caliper" },
            { id: 109, name: "Louis Vuitton Neverfull Bag" },
            { id: 110, name: "Industrial Steel Coil Type-A" }
        ];

        const products = productsData.map(p => ({
            productId: p.id,
            name: p.name,
            manufacturer: manufacturerId,
            manufacturerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardcoded match
            consumerSecretHash: '0x' + 'a'.repeat(64), // Mock 32-byte hash
            currentHandoverKey: null,
            productCertificate: {
                filename: 'mock-cert.pdf',
                path: 'uploads/mock-cert.pdf',
                uploadedAt: new Date()
            }
        }));

        await Product.insertMany(products);
        console.log(`✅ Created ${products.length} Products`);

        console.log('🎉 Data Seeding Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedData();
