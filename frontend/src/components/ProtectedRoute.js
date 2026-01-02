import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-logo">⛓️</div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check role-based access if roles are specified
    if (roles && roles.length > 0) {
        if (!user || !roles.includes(user.role)) {
            return (
                <div className="access-denied">
                    <h2>Access Denied</h2>
                    <p>You don't have permission to access this page.</p>
                    <p>Required role: {roles.join(' or ')}</p>
                </div>
            );
        }
    }

    return children;
};

export default ProtectedRoute;
