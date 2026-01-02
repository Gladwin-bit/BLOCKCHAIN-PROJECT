import React from 'react';
import { motion } from 'framer-motion';
import './RoleSelector.css';

const roles = [
    {
        id: 'manufacturer',
        title: 'Manufacturer',
        icon: '🏭',
        description: 'Create and mint products on the blockchain',
        requiresCertificate: true
    },
    {
        id: 'distributor',
        title: 'Distributor',
        icon: '🚚',
        description: 'Manage product transfers and logistics',
        requiresCertificate: true
    },
    {
        id: 'retailer',
        title: 'Retailer',
        icon: '🏪',
        description: 'Sell products to end consumers',
        requiresCertificate: true
    },
    {
        id: 'customer',
        title: 'Customer',
        icon: '👤',
        description: 'Verify and claim product ownership',
        requiresCertificate: false
    },
    {
        id: 'intermediate',
        title: 'Intermediate',
        icon: '🔗',
        description: 'Other supply chain participants',
        requiresCertificate: true
    }
];

const RoleSelector = ({ selectedRole, onRoleSelect }) => {
    return (
        <div className="role-selector">
            <div className="role-selector-header">
                <h3>Select Your Role</h3>
                <p>Choose the role that best describes your position in the supply chain</p>
            </div>

            <div className="roles-grid">
                {roles.map((role, index) => (
                    <motion.div
                        key={role.id}
                        className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                        onClick={() => onRoleSelect(role.id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="role-icon">{role.icon}</div>
                        <h4>{role.title}</h4>
                        <p>{role.description}</p>
                        {role.requiresCertificate && (
                            <span className="certificate-badge">Certificate Required</span>
                        )}
                        <div className="role-check">
                            {selectedRole === role.id && <span>✓</span>}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default RoleSelector;
