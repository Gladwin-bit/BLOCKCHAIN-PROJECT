import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Shipping container component
const ShippingContainer = ({ position, index }) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.elapsedTime;
        // Subtle floating animation
        meshRef.current.position.y = position[1] + Math.sin(time + index * 0.7) * 0.03;
        // Gentle rotation
        meshRef.current.rotation.y = Math.sin(time * 0.3 + index) * 0.1;
    });

    return (
        <group position={position}>
            <Box ref={meshRef} args={[0.3, 0.2, 0.15]}>
                <meshStandardMaterial
                    color="#A8A29E"
                    metalness={0.6}
                    roughness={0.4}
                />
            </Box>
            {/* Container details */}
            <Box position={[0, 0.11, 0]} args={[0.28, 0.01, 0.13]}>
                <meshStandardMaterial
                    color="#D4AF37"
                    metalness={0.8}
                    roughness={0.2}
                />
            </Box>
        </group>
    );
};

// Distribution node component
const DistributionNode = ({ position, index }) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.elapsedTime;
        // Pulse effect
        const scale = 1 + Math.sin(time * 2 + index) * 0.08;
        meshRef.current.scale.set(scale, scale, scale);
    });

    return (
        <Sphere ref={meshRef} args={[0.06, 16, 16]} position={position}>
            <meshStandardMaterial
                color="#D4AF37"
                emissive="#D4AF37"
                emissiveIntensity={0.4}
                metalness={0.9}
                roughness={0.1}
            />
        </Sphere>
    );
};

// Connection path
const ConnectionPath = ({ start, end, index }) => {
    const lineRef = useRef();

    useFrame((state) => {
        if (!lineRef.current) return;
        const time = state.clock.elapsedTime;
        const opacity = 0.15 + Math.abs(Math.sin(time * 0.5 + index)) * 0.15;
        lineRef.current.material.opacity = opacity;
    });

    const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    return (
        <line ref={lineRef} geometry={lineGeometry}>
            <lineBasicMaterial
                attach="material"
                color="#78716C"
                transparent
                opacity={0.2}
            />
        </line>
    );
};

// Main supply chain network visualization
const SupplyChainNetwork = () => {
    const groupRef = useRef();

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001;
        }
    });

    // Define network structure
    const nodes = [
        { pos: [0, 0, 0], type: 'center' },
        { pos: [-0.8, 0.3, 0], type: 'node' },
        { pos: [0.8, -0.3, 0.2], type: 'node' },
        { pos: [-0.5, -0.5, 0.3], type: 'node' },
        { pos: [0.6, 0.5, -0.2], type: 'node' },
    ];

    const containers = [
        { pos: [-0.4, 0.15, 0.1] },
        { pos: [0.4, -0.15, 0.15] },
        { pos: [-0.25, -0.25, 0.2] },
        { pos: [0.3, 0.25, -0.1] },
    ];

    const connections = [
        [nodes[0].pos, nodes[1].pos],
        [nodes[0].pos, nodes[2].pos],
        [nodes[0].pos, nodes[3].pos],
        [nodes[0].pos, nodes[4].pos],
    ];

    return (
        <group ref={groupRef}>
            {/* Render connection paths */}
            {connections.map((conn, index) => (
                <ConnectionPath
                    key={`conn-${index}`}
                    start={conn[0]}
                    end={conn[1]}
                    index={index}
                />
            ))}

            {/* Render distribution nodes */}
            {nodes.map((node, index) => (
                <DistributionNode
                    key={`node-${index}`}
                    position={node.pos}
                    index={index}
                />
            ))}

            {/* Render shipping containers */}
            {containers.map((container, index) => (
                <ShippingContainer
                    key={`container-${index}`}
                    position={container.pos}
                    index={index}
                />
            ))}
        </group>
    );
};

export default SupplyChainNetwork;
