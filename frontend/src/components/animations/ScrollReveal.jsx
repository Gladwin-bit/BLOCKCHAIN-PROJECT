import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ScrollReveal = ({
    children,
    direction = 'up', // 'up', 'down', 'left', 'right'
    distance = 60,
    duration = 0.8,
    delay = 0,
    stagger = 0.1,
    className = ''
}) => {
    const elementRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Determine initial position based on direction
        const initialState = {
            opacity: 0,
            y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
            x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
        };

        // Set initial state
        gsap.set(element, initialState);

        // Create scroll trigger animation
        const animation = gsap.to(element, {
            opacity: 1,
            y: 0,
            x: 0,
            duration,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: element,
                start: 'top 85%', // Animation starts when element is 85% from top of viewport
                toggleActions: 'play none none reverse',
                // markers: true, // Uncomment for debugging
            }
        });

        // If element has children and stagger is enabled
        const children = element.children;
        if (children.length > 1 && stagger > 0) {
            gsap.set(children, initialState);
            gsap.to(children, {
                opacity: 1,
                y: 0,
                x: 0,
                duration,
                stagger,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: element,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                }
            });
        }

        return () => {
            animation.kill();
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, [direction, distance, duration, delay, stagger]);

    return (
        <div ref={elementRef} className={className}>
            {children}
        </div>
    );
};

export default ScrollReveal;
