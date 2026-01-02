# Supply Chain Authentication System - Setup Guide

## Overview

This supply chain application now features a complete role-based authentication system with separate login flows for manufacturers, distributors, retailers, customers, and other intermediate persons.

## Architecture

### Backend (Express.js + MongoDB)
- User authentication with JWT tokens
- Role-based access control
- File upload handling for certificates and ID proofs
- User verification workflow

### Frontend (React)
- Modern authentication pages (Welcome, Login, Register)
- Protected routes based on authentication and roles
- File upload with drag-and-drop support
- Premium UI with glassmorphism effects

### Smart Contract (Solidity)
- Existing role-based permissions on blockchain
- Product creation, transfer, and verification

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- MetaMask browser extension
- Hardhat local node running

## Installation & Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Backend Environment

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/supplychain
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
UPLOAD_PATH=./uploads
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

### 4. Start Backend Server

```bash
cd backend
npm start
```

The backend API will be available at `http://localhost:5000`

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 6. Configure Frontend Environment

Create a `.env` file in the `frontend` directory (copy from `.env.example`):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 7. Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000`

### 8. Start Hardhat Node (if not already running)

```bash
# In the root directory
npx hardhat node
```

### 9. Deploy Smart Contract (if needed)

```bash
npx hardhat run scripts/deploy.js --network localhost
```

## User Roles & Permissions

### Customer
- **Permissions**: Verify products, view product history
- **Registration**: Only requires ID proof
- **Verification**: Auto-approved upon registration

### Manufacturer
- **Permissions**: Create products, transfer custody, manage products
- **Registration**: Requires ID proof + business certificate
- **Verification**: Requires admin approval

### Distributor
- **Permissions**: Accept custody, transfer products, verify products
- **Registration**: Requires ID proof + business certificate
- **Verification**: Requires admin approval

### Retailer
- **Permissions**: Accept custody, sell products, verify products
- **Registration**: Requires ID proof + business certificate
- **Verification**: Requires admin approval

### Intermediate Person
- **Permissions**: Accept custody, transfer products
- **Registration**: Requires ID proof + authorization document
- **Verification**: Requires admin approval

## Usage Flow

### For New Users

1. **Visit Welcome Page**: Navigate to `http://localhost:3000/welcome`
2. **Create Account**: Click "Get Started" or "Create Account"
3. **Select Role**: Choose your role in the supply chain
4. **Enter Information**: Provide name, email, and password
5. **Upload Documents**: 
   - All users: Upload ID proof (PDF, PNG, JPG)
   - Non-customers: Upload certificate/authorization document
6. **Submit**: Create your account
7. **Wait for Approval** (non-customers): Admin must verify your account
8. **Login**: Sign in with your email and password
9. **Connect Wallet**: Link your MetaMask wallet address
10. **Start Using**: Access role-specific features

### For Existing Users

1. **Login**: Navigate to `http://localhost:3000/login`
2. **Enter Credentials**: Email and password
3. **Access Dashboard**: View role-specific features

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (protected)
- `PUT /api/auth/link-wallet` - Link wallet address (protected)
- `POST /api/auth/logout` - Logout user (protected)

## File Upload

- **Accepted Formats**: PDF, PNG, JPG, JPEG
- **Maximum Size**: 5MB per file
- **Storage**: Local filesystem in `backend/uploads/`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- File type and size validation
- Protected routes on frontend
- Secure file upload handling

## Troubleshooting

### Backend won't start
- Ensure MongoDB is running
- Check if port 5000 is available
- Verify `.env` file exists and is configured correctly

### Frontend won't start
- Ensure backend is running
- Check if port 3000 is available
- Run `npm install` to install dependencies
- Verify `.env` file exists with correct API URL

### Cannot upload files
- Check file size (must be < 5MB)
- Verify file type (PDF, PNG, JPG, JPEG only)
- Ensure `backend/uploads` directory exists

### Login fails
- Verify backend is running
- Check MongoDB connection
- Ensure user exists in database
- Verify password is correct

### Wallet connection issues
- Ensure MetaMask is installed
- Check if Hardhat node is running
- Verify contract is deployed
- Check network in MetaMask (should be localhost:8545)

## Development Notes

### Adding New Roles

1. Update `backend/models/User.js` - Add role to enum
2. Update `frontend/src/components/RoleSelector.js` - Add role card
3. Update `frontend/src/App.js` - Add role to protected routes
4. Update smart contract if blockchain role is needed

### Customizing File Upload

Edit `backend/routes/auth.js` to modify:
- Accepted file types
- File size limits
- Storage location

### Styling

- Main styles: `frontend/src/index.css`
- Component styles: Individual CSS files in `frontend/src/components/` and `frontend/src/pages/`
- Theme: Managed by `ThemeContext.js`

## Production Deployment

### Backend

1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure MongoDB Atlas or production database
4. Set up cloud storage for file uploads (AWS S3, Google Cloud Storage)
5. Enable HTTPS
6. Set proper CORS origins

### Frontend

1. Build production bundle: `npm run build`
2. Deploy to hosting service (Vercel, Netlify, etc.)
3. Update `REACT_APP_API_URL` to production backend URL

## Support

For issues or questions, please check:
1. This README
2. Console logs (browser and server)
3. MongoDB logs
4. Hardhat node logs
