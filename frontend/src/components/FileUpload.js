import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './FileUpload.css';

const FileUpload = ({ label, name, accept, onChange, required, file, error }) => {
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        // Validate file type
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
        const fileType = selectedFile.type;

        const isValidType = acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                return fileExtension === type;
            }
            return fileType.match(type.replace('*', '.*'));
        });

        if (!isValidType) {
            onChange({ target: { name, files: null, error: 'Invalid file type' } });
            return;
        }

        // Validate file size (5MB max)
        if (selectedFile.size > 5 * 1024 * 1024) {
            onChange({ target: { name, files: null, error: 'File size must be less than 5MB' } });
            return;
        }

        onChange({ target: { name, files: [selectedFile], error: null } });
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const removeFile = () => {
        onChange({ target: { name, files: null, error: null } });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="file-upload-container">
            <label className="file-upload-label">
                {label}
                {required && <span className="required">*</span>}
            </label>

            {!file ? (
                <motion.div
                    className={`file-upload-dropzone ${dragActive ? 'active' : ''} ${error ? 'error' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleClick}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        name={name}
                        accept={accept}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                    />

                    <div className="upload-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </div>

                    <p className="upload-text">
                        <span className="upload-highlight">Click to upload</span> or drag and drop
                    </p>
                    <p className="upload-hint">PDF, PNG, JPG (max. 5MB)</p>
                </motion.div>
            ) : (
                <motion.div
                    className="file-preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="file-info">
                        <div className="file-icon">📄</div>
                        <div className="file-details">
                            <p className="file-name">{file.name}</p>
                            <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="remove-file-btn"
                        onClick={removeFile}
                        aria-label="Remove file"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </motion.div>
            )}

            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default FileUpload;
