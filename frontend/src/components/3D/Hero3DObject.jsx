import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

// Individual blockchain block with mouse interaction
const BlockchainBlock = ({ position, index, totalBlocks }) => {
    const meshRef = useRef();
    const edgesRef = useRef();
    const originalPosition = useRef(position);
    const { mouse, viewport } = useThree();

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.elapsedTime;

        // Calculate mouse position in 3D space
        const mouseX = (mouse.x * viewport.width) / 2;
        const mouseY = (mouse.y * viewport.height) / 2;

        // Calculate distance from cube to mouse
        const distance = Math.sqrt(
            Math.pow(mouseX - originalPosition.current[0], 2) +
            Math.pow(mouseY - originalPosition.current[1], 2)
        );

        // Magnetic attraction: pull towards mouse when nearby
        const attractionRadius = 4;
        const attractionStrength = 0.3;

        if (distance < attractionRadius) {
            const force = 1 - (distance / attractionRadius);
            const dx = mouseX - meshRef.current.position.x;
            const dy = mouseY - meshRef.current.position.y;

            meshRef.current.position.x += dx * force * attractionStrength;
            meshRef.current.position.y += dy * force * attractionStrength;

            // Scale up when near mouse
            const targetScale = 1 + force * 0.3;
            meshRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.1
            );
        } else {
            // Return to original position smoothly
            meshRef.current.position.x += (originalPosition.current[0] - meshRef.current.position.x) * 0.05;
            meshRef.current.position.y += (originalPosition.current[1] + Math.sin(time + index * 0.5) * 0.08 - meshRef.current.position.y) * 0.05;

            // Return to normal scale
            meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }

        // Gentle rotation
        meshRef.current.rotation.y += 0.003;
        meshRef.current.rotation.x += 0.001;

        // Pulse effect on edges
        if (edgesRef.current) {
            const pulse = (Math.sin(time * 2 + index) + 1) * 0.5;
            edgesRef.current.material.opacity = 0.4 + pulse * 0.3;
        }
    });

    return (
        <group position={position}>
            <Box ref={meshRef} args={[0.6, 0.6, 0.6]}>
                <meshStandardMaterial
                    color="#1E3A8A"
                    metalness={0.8}
                    roughness={0.2}
                    emissive="#1E3A8A"
                    emissiveIntensity={0.3}
                />
            </Box>
            <lineSegments ref={edgesRef}>
                <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(0.6, 0.6, 0.6)]} />
                <lineBasicMaterial attach="material" color="#FFFFFF" transparent opacity={0.6} />
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
            <lineBasicMaterial attach="material" color="#3B82F6" opacity={0.5} transparent />
        </line>
    );
};

// Main blockchain visualization
const BlockchainCubesHero = () => {
    const groupRef = useRef();
    const cubesPerSide = 6; // 6 cubes on each side

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001;

            // Gentle tilt based on mouse position
            const mouse = state.mouse;
            groupRef.current.rotation.x = mouse.y * 0.05;
            groupRef.current.rotation.y += mouse.x * 0.02;
        }
    });

    const blocks = [];
    const connectors = [];

    // Create cubes on LEFT and RIGHT sides, avoiding center
    for (let side = 0; side < 2; side++) {
        const sideFactor = side === 0 ? -1 : 1; // -1 for left, 1 for right

        for (let i = 0; i < cubesPerSide; i++) {
            // Position cubes vertically along the sides
            const x = sideFactor * (3 + Math.random() * 1); // 3-4 units from center
            const y = (i - cubesPerSide / 2) * 0.8 + Math.random() * 0.3; // Vertical distribution
            const z = (Math.random() - 0.5) * 2; // Some depth variation

            const index = side * cubesPerSide + i;

            blocks.push(
                <BlockchainBlock
                    key={`block-${index}`}
                    position={[x, y, z]}
                    index={index}
                    totalBlocks={cubesPerSide * 2}
                />
            );

            // Connect cubes vertically on each side
            if (i < cubesPerSide - 1) {
                const nextX = sideFactor * (3 + Math.random() * 1);
                const nextY = (i + 1 - cubesPerSide / 2) * 0.8 + Math.random() * 0.3;
                const nextZ = (Math.random() - 0.5) * 2;

                connectors.push(
                    <ChainConnector
                        key={`connector-${index}`}
                        start={[x, y, z]}
                        end={[nextX, nextY, nextZ]}
                    />
                );
            }
        }
    }

    return (
        <group ref={groupRef}>
            {blocks}
            {connectors}
        </group>
    );
};

const Hero3DObject = () => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'auto',
            zIndex: 0,
        }}>
            <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1.2} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3B82F6" />

                <BlockchainCubesHero />
            </Canvas>
        </div>
    );
};

export default Hero3DObject;
