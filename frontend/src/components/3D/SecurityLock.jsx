import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Torus, Cone, Box } from '@react-three/drei';

// Animated security lock
const SecurityLock = () => {
    const groupRef = useRef();
    const shackleRef = useRef();
    const bodyRef = useRef();

    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        // Gentle floating
        groupRef.current.position.y = Math.sin(time * 0.5) * 0.1;

        // Rotate the entire lock
        groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.2;

        // Pulse the glow
        if (bodyRef.current) {
            const pulse = (Math.sin(time * 2) + 1) * 0.5;
            bodyRef.current.material.emissiveIntensity = 0.2 + pulse * 0.3;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Lock Body */}
            <Box ref={bodyRef} args={[0.4, 0.5, 0.2]} position={[0, -0.2, 0]}>
                <meshStandardMaterial
                    color="#D4AF37"
                    metalness={0.9}
                    roughness={0.1}
                    emissive="#D4AF37"
                    emissiveIntensity={0.3}
                />
            </Box>

            {/* Lock Shackle */}
            <group ref={shackleRef} position={[0, 0.15, 0]}>
                <Torus args={[0.15, 0.04, 16, 32, Math.PI]} rotation={[0, 0, 0]}>
                    <meshStandardMaterial
                        color="#D4AF37"
                        metalness={0.9}
                        roughness={0.1}
                    />
                </Torus>
            </group>

            {/* Keyhole indicator */}
            <Cylinder args={[0.03, 0.03, 0.15, 8]} position={[0, -0.2, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial
                    color="#1C1917"
                    metalness={0.5}
                    roughness={0.5}
                />
            </Cylinder>
        </group>
    );
};

export default SecurityLock;
