import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const importData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Read database files
        const usersPath = path.join(__dirname, '../../DATABASE/supplychain.users.json');
        const productsPath = path.join(__dirname, '../../DATABASE/supplychain.products.json');

        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

        // Convert MongoDB Extended JSON to regular JSON
        const convertExtendedJSON = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(convertExtendedJSON);
            }
            if (obj && typeof obj === 'object') {
                if (obj.$oid) {
                    return new mongoose.Types.ObjectId(obj.$oid);
                }
                if (obj.$date) {
                    return new Date(obj.$date);
                }
                const converted = {};
                for (const [key, value] of Object.entries(obj)) {
                    converted[key] = convertExtendedJSON(value);
                }
                return converted;
            }
            return obj;
        };

        const convertedUsers = convertExtendedJSON(usersData);
        const convertedProducts = convertExtendedJSON(productsData);

        console.log(`📄 Found ${usersData.length} users`);
        console.log(`📄 Found ${productsData.length} products`);

        // Get collections
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const productsCollection = db.collection('products');

        // Clear existing data
        await usersCollection.deleteMany({});
        await productsCollection.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // Import users
        if (convertedUsers.length > 0) {
            await usersCollection.insertMany(convertedUsers);
            console.log(`✅ Imported ${convertedUsers.length} users`);
        }

        // Import products
        if (convertedProducts.length > 0) {
            await productsCollection.insertMany(convertedProducts);
            console.log(`✅ Imported ${convertedProducts.length} products`);
        }

        console.log('🎉 Database import completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error importing data:', error);
        process.exit(1);
    }
};

importData();
