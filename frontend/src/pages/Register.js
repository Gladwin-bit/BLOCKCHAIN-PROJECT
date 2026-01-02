// src/pages/Register.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import RoleSelector from '../components/RoleSelector';
import FileUpload from '../components/FileUpload';
import './Register.css';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        role: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        idProof: null,
        certificate: null
    });
    const [walletAddress, setWalletAddress] = useState('');
    const [walletConnected, setWalletConnected] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { register: registerUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Connect MetaMask wallet
    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                setWalletAddress(accounts[0]);
                setWalletConnected(true);
                if (errors.wallet) {
                    setErrors(prev => ({ ...prev, wallet: '' }));
                }
            } catch (error) {
                console.error('Error connecting wallet:', error);
                setErrors(prev => ({ ...prev, wallet: 'Failed to connect wallet' }));
            }
        } else {
            setErrors(prev => ({ ...prev, wallet: 'MetaMask is not installed' }));
        }
    };

    const requiresCertificate = formData.role && formData.role !== 'customer';

    const validateStep = (currentStep) => {
        const newErrors = {};

        if (currentStep === 1) {
            if (!formData.role) {
                newErrors.role = 'Please select a role';
            }
        }

        if (currentStep === 2) {
            if (!formData.name.trim()) {
                newErrors.name = 'Name is required';
            }

            if (!formData.email) {
                newErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Email is invalid';
            }

            if (!formData.password) {
                newErrors.password = 'Password is required';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }

            // Validate wallet connection
            if (!walletConnected) {
                newErrors.wallet = 'Please connect your MetaMask wallet';
            }
        }

        if (currentStep === 3) {
            if (!formData.idProof) {
                newErrors.idProof = 'ID proof is required';
            }

            if (requiresCertificate && !formData.certificate) {
                newErrors.certificate = 'Certificate is required for this role';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
        setErrors({});
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({ ...prev, role }));
        if (errors.role) {
            setErrors(prev => ({ ...prev, role: '' }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files, error } = e.target;

        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
            setFormData(prev => ({ ...prev, [name]: null }));
        } else {
            setFormData(prev => ({ ...prev, [name]: files ? files[0] : null }));
            if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(3)) {
            return;
        }

        if (!walletConnected) {
            setErrors({ wallet: 'Please connect your MetaMask wallet' });
            return;
        }

        setLoading(true);

        // Create FormData for file upload
        const submitData = new FormData();
        submitData.append('email', formData.email);
        submitData.append('password', formData.password);
        submitData.append('name', formData.name);
        submitData.append('role', formData.role);
        submitData.append('walletAddress', walletAddress); // Add wallet address
        submitData.append('idProof', formData.idProof);

        if (formData.certificate) {
            submitData.append('certificate', formData.certificate);
        }

        const result = await registerUser(submitData);
        setLoading(false);

        if (result.success) {
            navigate('/');
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <RoleSelector
                            selectedRole={formData.role}
                            onRoleSelect={handleRoleSelect}
                        />
                        {errors.role && <span className="error-message">{errors.role}</span>}
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="form-step"
                    >
                        <h3>Basic Information</h3>
                        <p className="step-description">Enter your personal details</p>

                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={errors.name ? 'error' : ''}
                                placeholder="John Doe"
                            />
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'error' : ''}
                                placeholder="you@example.com"
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'error' : ''}
                                placeholder="••••••••"
                            />
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'error' : ''}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>

                        <div className="form-group">
                            <label>MetaMask Wallet</label>
                            {!walletConnected ? (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={connectWallet}
                                    style={{ width: '100%' }}
                                >
                                    Connect MetaMask Wallet
                                </button>
                            ) : (
                                <div className="wallet-connected">
                                    <span className="success-message">
                                        ✓ Wallet Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                    </span>
                                </div>
                            )}
                            {errors.wallet && <span className="error-message">{errors.wallet}</span>}
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="form-step"
                    >
                        <h3>Verification Documents</h3>
                        <p className="step-description">Upload required documents for verification</p>

                        <FileUpload
                            label="ID Proof"
                            name="idProof"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                            required
                            file={formData.idProof}
                            error={errors.idProof}
                        />

                        {requiresCertificate && (
                            <FileUpload
                                label="Certificate / Authorization Document"
                                name="certificate"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={handleFileChange}
                                required
                                file={formData.certificate}
                                error={errors.certificate}
                            />
                        )}

                        {!requiresCertificate && (
                            <div className="info-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                <p>As a customer, you only need to provide ID proof. Your account will be activated immediately.</p>
                            </div>
                        )}

                        {requiresCertificate && (
                            <div className="info-box warning">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                <p>Your account will be pending admin approval until your certificate is verified.</p>
                            </div>
                        )}
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <motion.div
                    className="register-card glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="register-header">
                        <div className="logo-section">
                            <span className="logo-icon">⛓️</span>
                            <h1>Create Account</h1>
                        </div>
                        <p>Join the secure supply chain network</p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="progress-indicator">
                        <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <div className="step-number">1</div>
                            <span>Role</span>
                        </div>
                        <div className="progress-line"></div>
                        <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                            <div className="step-number">2</div>
                            <span>Info</span>
                        </div>
                        <div className="progress-line"></div>
                        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <span>Documents</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="register-form">
                        <AnimatePresence mode="wait">
                            {renderStep()}
                        </AnimatePresence>

                        <div className="form-actions">
                            {step > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleBack}
                                >
                                    Back
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleNext}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="register-footer">
                        <p>Already have an account? <Link to="/login" className="link">Sign in</Link></p>
                    </div>
                </motion.div>

                <div className="register-decoration">
                    <div className="decoration-blob blob-1"></div>
                    <div className="decoration-blob blob-2"></div>
                </div>
            </div>
        </div>
    );
};

export default Register;
