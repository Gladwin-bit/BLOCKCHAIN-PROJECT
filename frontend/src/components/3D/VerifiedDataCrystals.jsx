import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Octahedron } from '@react-three/drei';

// Individual data crystal
const DataCrystal = ({ position, scale = 1, color = "#D4AF37", delay = 0 }) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.elapsedTime + delay;

        // Rotation animation
        meshRef.current.rotation.x = time * 0.3;
        meshRef.current.rotation.y = time * 0.5;

        // Floating animation
        meshRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.1;

        // Pulse glow
        const pulse = (Math.sin(time * 2) + 1) * 0.5;
        meshRef.current.material.emissiveIntensity = 0.2 + pulse * 0.4;
    });

    return (
        <Octahedron ref={meshRef} args={[0.15 * scale, 0]} position={position}>
            <meshStandardMaterial
                color={color}
                metalness={0.8}
                roughness={0.2}
                emissive={color}
                emissiveIntensity={0.3}
                transparent
                opacity={0.9}
            />
        </Octahedron>
    );
};

// Group of verified data crystals
const VerifiedDataCrystals = () => {
    const crystals = [
        { pos: [-0.5, 0.3, 0], scale: 1, color: "#D4AF37", delay: 0 },
        { pos: [0.5, 0.5, -0.3], scale: 0.8, color: "#E5C347", delay: 0.5 },
        { pos: [0, -0.2, 0.5], scale: 1.2, color: "#D4AF37", delay: 1 },
        { pos: [-0.3, -0.4, -0.2], scale: 0.7, color: "#B8941F", delay: 1.5 },
        { pos: [0.6, 0, 0.3], scale: 0.9, color: "#D4AF37", delay: 2 },
    ];

    return (
        <group>
            {crystals.map((crystal, index) => (
                <DataCrystal
                    key={index}
                    position={crystal.pos}
                    scale={crystal.scale}
                    color={crystal.color}
                    delay={crystal.delay}
                />
            ))}
        </group>
    );
};

export default VerifiedDataCrystals;
