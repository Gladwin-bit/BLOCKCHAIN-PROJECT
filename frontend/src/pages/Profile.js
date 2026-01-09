import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDeleteAccount = async () => {
        if (confirmText !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/auth/account`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Logout and redirect
            logout();
            navigate('/');
        } catch (err) {
            console.error('Delete account error:', err);
            setError(err.response?.data?.message || 'Failed to delete account');
            setIsDeleting(false);
        }
    };

    if (!user) {
        return (
            <div className="profile-container">
                <div className="profile-card">
                    <h2>Please log in to view your profile</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h1>My Profile</h1>

                <div className="profile-section">
                    <h2>Account Information</h2>
                    <div className="profile-info">
                        <div className="info-row">
                            <label>Name:</label>
                            <span>{user.name}</span>
                        </div>
                        <div className="info-row">
                            <label>Email:</label>
                            <span>{user.email}</span>
                        </div>
                        <div className="info-row">
                            <label>Role:</label>
                            <span className="role-badge">{user.role}</span>
                        </div>
                        {user.walletAddress && (
                            <div className="info-row">
                                <label>Wallet:</label>
                                <span className="wallet-address">{user.walletAddress}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-section danger-zone">
                    <h2>Danger Zone</h2>
                    <p className="warning-text">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                        className="delete-account-btn"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Delete Account</h2>
                        <p className="modal-warning">
                            ⚠️ This action cannot be undone. This will permanently delete your account and remove all your data.
                        </p>

                        <div className="confirm-section">
                            <label>Type <strong>DELETE</strong> to confirm:</label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                                className="confirm-input"
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setConfirmText('');
                                    setError('');
                                }}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-delete-btn"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || confirmText !== 'DELETE'}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Forever'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
