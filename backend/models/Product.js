import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    productId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    manufacturer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    manufacturerAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    secretHash: {
        type: String,
        required: true
    },
    productCertificate: {
        filename: {
            type: String,
            required: true
        },
        path: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    blockchainTxHash: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
productSchema.index({ manufacturer: 1, createdAt: -1 });
productSchema.index({ manufacturerAddress: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
