import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import './FloatingElements.css';

const FloatingElement = ({ delay = 0, children, className = '' }) => {
    const props = useSpring({
        from: { transform: 'translateY(0px)' },
        to: async (next) => {
            while (true) {
                await next({ transform: 'translateY(-20px)' });
                await next({ transform: 'translateY(0px)' });
            }
        },
        config: { duration: 3000 },
        delay,
    });

    return (
        <animated.div style={props} className={`floating-element ${className}`}>
            {children}
        </animated.div>
    );
};

const FloatingElements = () => {
    return (
        <div className="floating-elements-container">
            <FloatingElement delay={0} className="float-element-1">
                <div className="shape shape-cube"></div>
            </FloatingElement>

            <FloatingElement delay={1000} className="float-element-2">
                <div className="shape shape-circle"></div>
            </FloatingElement>

            <FloatingElement delay={2000} className="float-element-3">
                <div className="shape shape-triangle"></div>
            </FloatingElement>
        </div>
    );
};

export default FloatingElements;
