// src/components/SearchBar.js
import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import './SearchBar.css';

const SearchBar = ({ data, onResultSelect, placeholder = 'Search products...' }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const fuseOptions = {
        keys: ['name', 'batchId', 'id'],
        threshold: 0.3,
        includeScore: true
    };

    const fuse = new Fuse(data || [], fuseOptions);

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            setShowResults(false);
            return;
        }

        const searchResults = fuse.search(query);
        setResults(searchResults.slice(0, 5));
        setShowResults(true);
    }, [query]);

    const handleSelect = (item) => {
        setQuery('');
        setShowResults(false);
        if (onResultSelect) {
            onResultSelect(item.item);
        }
    };

    return (
        <div className="search-bar-container">
            <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                />
                {query && (
                    <button className="search-clear" onClick={() => setQuery('')}>
                        ✕
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showResults && results.length > 0 && (
                    <motion.div
                        className="search-results"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {results.map((result, index) => (
                            <motion.div
                                key={index}
                                className="search-result-item"
                                onClick={() => handleSelect(result)}
                                whileHover={{ backgroundColor: 'rgba(102, 126, 234, 0.1)' }}
                            >
                                <div className="result-title">{result.item.name}</div>
                                <div className="result-meta">
                                    ID: {result.item.id} | Batch: {result.item.batchId}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchBar;
