import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

// Individual blockchain block
const BlockchainBlock = ({ position, index, totalBlocks }) => {
    const meshRef = useRef();
    const edgesRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;

        // Subtle floating animation with offset based on index
        const time = state.clock.elapsedTime;
        meshRef.current.position.y = position[1] + Math.sin(time + index * 0.5) * 0.05;

        // Gentle rotation
        meshRef.current.rotation.y += 0.002;

        // Pulse effect on edges
        if (edgesRef.current) {
            const pulse = (Math.sin(time * 2 + index) + 1) * 0.5;
            edgesRef.current.material.opacity = 0.3 + pulse * 0.3;
        }
    });

    return (
        <group position={position}>
            <Box ref={meshRef} args={[0.4, 0.4, 0.4]}>
                <meshStandardMaterial
                    color="#D4AF37"
                    metalness={0.8}
                    roughness={0.2}
                    emissive="#D4AF37"
                    emissiveIntensity={0.2}
                />
            </Box>
            <lineSegments ref={edgesRef}>
                <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(0.4, 0.4, 0.4)]} />
                <lineBasicMaterial attach="material" color="#FFFFFF" transparent opacity={0.5} />
            </lineSegments>
        </group>
    );
};

// Chain connector line
const ChainConnector = ({ start, end }) => {
    const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    return (
        <line geometry={lineGeometry}>
            <lineBasicMaterial attach="material" color="#D4AF37" opacity={0.4} transparent />
        </line>
    );
};

// Main blockchain visualization
const BlockchainCubes = () => {
    const groupRef = useRef();
    const numBlocks = 5;

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001;
        }
    });

    const blocks = [];
    const connectors = [];
    const spacing = 0.6;

    // Create blocks in a chain formation
    for (let i = 0; i < numBlocks; i++) {
        const x = (i - (numBlocks - 1) / 2) * spacing;
        const y = Math.sin(i * 0.5) * 0.2;
        const z = 0;

        blocks.push(
            <BlockchainBlock
                key={`block-${i}`}
                position={[x, y, z]}
                index={i}
                totalBlocks={numBlocks}
            />
        );

        // Add connector between blocks
        if (i < numBlocks - 1) {
            const nextX = (i + 1 - (numBlocks - 1) / 2) * spacing;
            const nextY = Math.sin((i + 1) * 0.5) * 0.2;
            connectors.push(
                <ChainConnector
                    key={`connector-${i}`}
                    start={[x, y, z]}
                    end={[nextX, nextY, z]}
                />
            );
        }
    }

    return (
        <group ref={groupRef}>
            {blocks}
            {connectors}
        </group>
    );
};

export default BlockchainCubes;
