import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSupplyChain } from '../hooks/useSupplyChain';
import Dashboard from './Dashboard';
import './Dashboard.css';

const ConsumerView = () => {
    const { productId } = useParams();
    const { getProductData, recordVerification, account } = useSupplyChain();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const data = await getProductData(productId);
            setProduct(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) fetchData();
    }, [productId]);

    const handleRecordVerification = async (id, loc, rem) => {
        await recordVerification(id, loc, rem);
        await fetchData(); // Refresh history
    };

    if (loading) return <div className="loading-container">Connecting to ledger...</div>;
    if (!product) return <div className="error-container">Product not found.</div>;

    return (
        <div className="consumer-page">
            <Dashboard
                product={product}
                account={account}
                onRecordVerification={handleRecordVerification}
            />
        </div>
    );
};

export default ConsumerView;
