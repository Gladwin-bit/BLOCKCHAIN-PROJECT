import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Verify digital signature in a PDF document
 * @param {File} file - The PDF file to verify
 * @returns {Promise<Object>} Verification result
 */
export const verifyDigitalSignature = async (file) => {
    try {
        console.log('🔍 [Frontend] Starting verification for:', file.name);
        console.log('📄 [Frontend] File size:', file.size, 'bytes');
        console.log('📄 [Frontend] File type:', file.type);

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            console.log('❌ [Frontend] Not a PDF file');
            return {
                success: false,
                verified: false,
                message: 'Only PDF files can be verified for digital signatures'
            };
        }

        // Create FormData
        const formData = new FormData();
        formData.append('certificate', file);

        const apiUrl = `${API_URL}/signature/verify`;
        console.log('🌐 [Frontend] Calling API:', apiUrl);

        // Call verification API
        const response = await axios.post(apiUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('✅ [Frontend] API Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ [Frontend] Verification error:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        // Handle different error scenarios
        if (error.response) {
            console.log('📡 [Frontend] Server responded with error:', error.response.status);
            return {
                success: false,
                verified: false,
                message: error.response.data.message || 'Verification failed',
                error: error.response.data.error
            };
        } else if (error.request) {
            console.log('📡 [Frontend] No response from server');
            return {
                success: false,
                verified: false,
                message: 'Unable to connect to verification service. Please try again.'
            };
        } else {
            console.log('⚠️ [Frontend] Request setup error');
            return {
                success: false,
                verified: false,
                message: 'An error occurred during verification'
            };
        }
    }
};
