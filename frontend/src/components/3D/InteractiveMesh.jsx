import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const InteractiveMesh = ({ count = 40, size = 0.05, color = "#D4AF37" }) => {
    const meshRef = useRef();
    const lineRef = useRef();
    const { mouse, viewport } = useThree();

    // Generate initial particle positions
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * viewport.width * 2;
            const y = (Math.random() - 0.5) * viewport.height * 2;
            const z = (Math.random() - 0.5) * 5;
            temp.push({ x, y, z, ox: x, oy: y, oz: z, vx: 0, vy: 0 });
        }
        return temp;
    }, [count, viewport.width, viewport.height]);

    const points = useMemo(() => new Float32Array(count * 3), [count]);
    const lineGeometry = useMemo(() => new THREE.BufferGeometry(), []);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        const targetX = (mouse.x * viewport.width) / 2;
        const targetY = (mouse.y * viewport.height) / 2;

        for (let i = 0; i < count; i++) {
            const p = particles[i];

            // Floating movement
            const fx = Math.sin(time * 0.5 + i) * 0.01;
            const fy = Math.cos(time * 0.5 + i) * 0.01;

            // Mouse interaction
            const dx = targetX - p.x;
            const dy = targetY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3) {
                const force = (3 - dist) / 3;
                p.vx += dx * force * 0.02;
                p.vy += dy * force * 0.02;
            }

            // Damping and return to origin
            p.vx *= 0.9;
            p.vy *= 0.9;
            p.x += (p.ox + fx - p.x) * 0.02 + p.vx;
            p.y += (p.oy + fy - p.y) * 0.02 + p.vy;

            points[i * 3] = p.x;
            points[i * 3 + 1] = p.y;
            points[i * 3 + 2] = p.z;
        }

        meshRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <group>
            <points ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={count}
                        array={points}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={size}
                    color={color}
                    transparent
                    opacity={0.6}
                    sizeAttenuation={true}
                />
            </points>
        </group>
    );
};

export default InteractiveMesh;
