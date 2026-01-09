import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req, res) => {
    try {
        const { email, password, name, role, walletAddress } = req.body;

        // Validate required fields
        if (!email || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: email, password, name, role'
            });
        }

        // Wallet address is required
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required. Please connect your MetaMask wallet.'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Check if wallet address already registered
        const existingWallet = await User.findOne({
            walletAddress: { $regex: new RegExp(`^${walletAddress}$`, 'i') }
        });
        if (existingWallet) {
            return res.status(400).json({
                success: false,
                message: 'This wallet address is already registered'
            });
        }

        // Validate role
        const validRoles = ['manufacturer', 'distributor', 'retailer', 'customer', 'intermediate'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
            });
        }

        // For non-customer roles, certificate is required
        if (role !== 'customer' && !req.files?.certificate) {
            return res.status(400).json({
                success: false,
                message: 'Certificate/authorization document is required for this role'
            });
        }

        // ID proof is required for all users
        if (!req.files?.idProof) {
            return res.status(400).json({
                success: false,
                message: 'ID proof is required'
            });
        }

        // Create user object
        const userData = {
            email: email.toLowerCase(),
            password,
            name,
            role,
            walletAddress: walletAddress.toLowerCase(), // Save wallet address
            idProof: {
                filename: req.files.idProof[0].filename,
                path: req.files.idProof[0].path,
                uploadedAt: new Date()
            }
        };

        // Add certificate if provided
        if (req.files?.certificate) {
            userData.certificate = {
                filename: req.files.certificate[0].filename,
                path: req.files.certificate[0].path,
                uploadedAt: new Date()
            };
        }

        // Auto-verify customers, others need admin approval
        userData.isVerified = role === 'customer';

        // Create user
        const user = await User.create(userData);

        console.log('User registered with wallet:', walletAddress);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: role === 'customer'
                ? 'Registration successful! You can now log in.'
                : 'Registration successful! Your account is pending admin approval.',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.isVerified,
                walletAddress: user.walletAddress
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        // Clean up uploaded files if user creation fails
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user and include password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.isVerified,
                walletAddress: user.walletAddress
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.isVerified,
                walletAddress: user.walletAddress,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user information',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/auth/link-wallet
 * @desc    Link wallet address to user account
 * @access  Private
 */
export const linkWallet = async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        // Validate Ethereum address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Ethereum wallet address'
            });
        }

        // Check if wallet is already linked to another user
        const existingUser = await User.findOne({
            walletAddress: walletAddress.toLowerCase(),
            _id: { $ne: req.user._id }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'This wallet address is already linked to another account'
            });
        }

        // Update user's wallet address
        req.user.walletAddress = walletAddress.toLowerCase();
        await req.user.save();

        res.json({
            success: true,
            message: 'Wallet linked successfully',
            user: {
                id: req.user._id,
                email: req.user.email,
                name: req.user.name,
                role: req.user.role,
                walletAddress: req.user.walletAddress
            }
        });
    } catch (error) {
        console.error('Link wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to link wallet',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
export const logout = async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};
/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account permanently
 * @access  Private
 */
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete uploaded files (ID proof and certificate)
        const filesToDelete = [];

        if (user.idProof && user.idProof.path) {
            filesToDelete.push(user.idProof.path);
        }

        if (user.certificate && user.certificate.path) {
            filesToDelete.push(user.certificate.path);
        }

        // Delete files from filesystem
        for (const filePath of filesToDelete) {
            try {
                const fullPath = path.join(process.cwd(), filePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log('Deleted file:', fullPath);
                }
            } catch (fileError) {
                console.error('Error deleting file:', fileError.message);
                // Continue even if file deletion fails
            }
        }

        // Delete user from database
        await User.findByIdAndDelete(userId);

        console.log('User account deleted:', user.email);

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting account',
            error: error.message
        });
    }
};
