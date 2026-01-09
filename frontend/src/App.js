// src/App.js
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, NavLink, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ThemeToggle from './components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { SupplyChainProvider, useSupplyChainContext } from './context/SupplyChainContext';
import { ConnectButton } from './components/ConnectButton';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import './components/NavBar.css';

const Home = lazy(() => import('./pages/Home'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const VerifyProduct = lazy(() => import('./pages/VerifyProduct'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const ManageCustody = lazy(() => import('./pages/ManageCustody'));
const RecordProcedure = lazy(() => import('./pages/RecordProcedure'));
const TraceProduct = lazy(() => import('./pages/TraceProduct'));
const UploadQR = lazy(() => import('./pages/UploadQR'));
const ConsumerView = lazy(() => import('./pages/ConsumerView'));
const BlockchainExplorer = lazy(() => import('./pages/BlockchainExplorer'));

function Navbar() {
    const { account, connectWallet } = useSupplyChainContext();
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to={isAuthenticated ? "/" : "/welcome"}>
                    <span className="logo-icon">⛓️</span>
                    <span className="logo-text">SupplyChain</span>
                </Link>
            </div>

            {isAuthenticated && (
                <div className="nav-links">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
                    {user && user.role === 'manufacturer' && (
                        <NavLink to="/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Create</NavLink>
                    )}
                    {user && user.role !== 'customer' && (
                        <NavLink to="/custody" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Manage</NavLink>
                    )}
                    <NavLink to="/verify" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Verify</NavLink>
                    <NavLink to="/trace" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Trace</NavLink>
                    <NavLink to="/explorer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Blockchain</NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>



                    <div className="nav-user-section">
                        {user && (
                            <div className="user-badge">
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">{user.role}</span>
                            </div>
                        )}

                        {account ? (
                            <div className="wallet-info">
                                <span className="wallet-address">{account.slice(0, 6)}...{account.slice(-4)}</span>
                            </div>
                        ) : (
                            <ConnectButton
                                onClick={connectWallet}
                                className="nav-connect"
                            />
                        )}

                        <button onClick={logout} className="btn-logout" title="Logout">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </button>
                    </div>

                    <ThemeToggle />
                </div>
            )}

            {!isAuthenticated && (
                <div className="nav-links">
                    <Link to="/login" className="btn btn-secondary">Sign In</Link>
                    <Link to="/register" className="btn btn-primary">Get Started</Link>
                </div>
            )}
        </nav>
    );
}

function AnimatedRoutes() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    return (
        <Suspense fallback={
            <div className="loading-screen">
                <motion.div
                    className="loading-logo"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >⛓️</motion.div>
                <p>Establishing secure connection...</p>
            </div>
        }>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    {/* Public routes */}
                    <Route path="/welcome" element={<PageWrapper><Welcome /></PageWrapper>} />
                    <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                    <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />

                    {/* Protected routes */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <PageWrapper><Home /></PageWrapper>
                        </ProtectedRoute>
                    } />
                    <Route path="/create" element={
                        <ProtectedRoute roles={['manufacturer']}>
                            <PageWrapper><RecordProcedure /></PageWrapper>
                        </ProtectedRoute>
                    } />
                    <Route path="/trace" element={
                        <ProtectedRoute>
                            <PageWrapper><TraceProduct /></PageWrapper>
                        </ProtectedRoute>
                    } />
                    <Route path="/custody" element={
                        <ProtectedRoute roles={['manufacturer', 'distributor', 'retailer', 'intermediate']}>
                            <PageWrapper><ManageCustody /></PageWrapper>
                        </ProtectedRoute>
                    } />
                    <Route path="/verify" element={
                        <ProtectedRoute>
                            <PageWrapper><VerifyProduct /></PageWrapper>
                        </ProtectedRoute>
                    } />
                    <Route path="/explorer" element={
                        <ProtectedRoute>
                            <PageWrapper><BlockchainExplorer /></PageWrapper>
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <PageWrapper><Profile /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    <Route path="/upload-qr" element={
                        <ProtectedRoute>
                            <PageWrapper><UploadQR /></PageWrapper>
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard/:productId" element={
                        <ProtectedRoute>
                            <PageWrapper><ConsumerView /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    {/* Redirect root based on auth status */}
                    <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/welcome"} replace />} />
                </Routes>
            </AnimatePresence>
        </Suspense>
    );
}

function PageWrapper({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="page-wrapper"
        >
            {children}
        </motion.div>
    );
}

function App() {
    return (
        <AuthProvider>
            <SupplyChainProvider>
                <ThemeProvider>
                    <Router>
                        <div className="App">
                            <div className="mesh-gradient"></div>
                            <Navbar />
                            <AnimatedRoutes />

                            <ToastContainer
                                position="bottom-right"
                                autoClose={3000}
                                theme="dark"
                                toastClassName="glass-toast"
                            />
                        </div>
                    </Router>
                </ThemeProvider>
            </SupplyChainProvider>
        </AuthProvider>
    );
}

export default App;
