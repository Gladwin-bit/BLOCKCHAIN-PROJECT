import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

// Individual network node
const NetworkNode = ({ position, connections, index }) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.elapsedTime;
        // Pulse animation
        const scale = 1 + Math.sin(time * 2 + index) * 0.1;
        meshRef.current.scale.set(scale, scale, scale);
    });

    return (
        <Sphere ref={meshRef} args={[0.08, 16, 16]} position={position}>
            <meshStandardMaterial
                color="#D4AF37"
                emissive="#D4AF37"
                emissiveIntensity={0.5}
                metalness={0.8}
                roughness={0.2}
            />
        </Sphere>
    );
};

// Animated connection line
const AnimatedConnection = ({ start, end, index }) => {
    const lineRef = useRef();

    useFrame((state) => {
        if (!lineRef.current) return;
        const time = state.clock.elapsedTime;
        const opacity = 0.2 + Math.abs(Math.sin(time + index * 0.5)) * 0.3;
        lineRef.current.material.opacity = opacity;
    });

    const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];

    return (
        <Line
            ref={lineRef}
            points={points}
            color="#78716C"
            lineWidth={1}
            transparent
            opacity={0.3}
        />
    );
};

// Network visualization component
const NetworkNodes = () => {
    const groupRef = useRef();

    // Generate network topology
    const { nodes, connections } = useMemo(() => {
        const nodeCount = 8;
        const nodes = [];
        const connections = [];

        // Create nodes in a spherical distribution
        for (let i = 0; i < nodeCount; i++) {
            const theta = (i / nodeCount) * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 1 + Math.random() * 0.5;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            nodes.push({ position: [x, y, z], id: i });
        }

        // Create connections between nearby nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const distance = new THREE.Vector3(...nodes[i].position)
                    .distanceTo(new THREE.Vector3(...nodes[j].position));

                // Connect nodes that are close enough
                if (distance < 1.5) {
                    connections.push({
                        start: nodes[i].position,
                        end: nodes[j].position,
                        id: `${i}-${j}`
                    });
                }
            }
        }

        return { nodes, connections };
    }, []);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002;
            groupRef.current.rotation.x += 0.001;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Render connections first (behind nodes) */}
            {connections.map((conn, index) => (
                <AnimatedConnection
                    key={conn.id}
                    start={conn.start}
                    end={conn.end}
                    index={index}
                />
            ))}

            {/* Render nodes */}
            {nodes.map((node, index) => (
                <NetworkNode
                    key={node.id}
                    position={node.position}
                    index={index}
                />
            ))}
        </group>
    );
};

export default NetworkNodes;
