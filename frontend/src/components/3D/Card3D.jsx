import React, { useRef, useState } from 'react';
import './Card3D.css';

const Card3D = ({ children, className = '', intensity = 10 }) => {
    const cardRef = useRef(null);
    const [transform, setTransform] = useState('');

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * intensity;
        const rotateY = ((centerX - x) / centerX) * intensity;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    };

    return (
        <div
            ref={cardRef}
            className={`card-3d ${className}`}
            style={{ transform }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="card-3d-content">
                {children}
            </div>
            <div className="card-3d-shine"></div>
        </div>
    );
};

export default Card3D;
