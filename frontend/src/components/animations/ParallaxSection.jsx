import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ParallaxSection.css';

gsap.registerPlugin(ScrollTrigger);

const ParallaxSection = ({ children, speed = 0.5, className = '' }) => {
    const sectionRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        const section = sectionRef.current;
        const content = contentRef.current;

        if (!section || !content) return;

        // Create parallax effect
        gsap.to(content, {
            y: () => section.offsetHeight * speed,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, [speed]);

    return (
        <div ref={sectionRef} className={`parallax-section ${className}`}>
            <div ref={contentRef} className="parallax-content">
                {children}
            </div>
        </div>
    );
};

export default ParallaxSection;
