// src/components/ThemeToggle.js
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <div className="toggle-track">
                <div className={`toggle-thumb ${theme}`}>
                    {theme === 'dark' ? '🌙' : '☀️'}
                </div>
            </div>
        </button>
    );
};

export default ThemeToggle;
