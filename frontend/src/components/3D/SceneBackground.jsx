import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sphere, Box, Torus } from '@react-three/drei';
import BlockchainCubes from './BlockchainCubes';
import NetworkNodes from './NetworkNodes';
import SecurityLock from './SecurityLock';
import VerifiedDataCrystals from './VerifiedDataCrystals';

const FloatingShape = ({ position, geometry, color, speed = 1 }) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.001 * speed;
            meshRef.current.rotation.y += 0.002 * speed;
        }
    });

    return (
        <Float
            speed={speed}
            rotationIntensity={0.5}
            floatIntensity={0.5}
            position={position}
        >
            {geometry === 'sphere' && (
                <Sphere ref={meshRef} args={[0.5, 32, 32]}>
                    <meshStandardMaterial color={color} opacity={0.6} transparent />
                </Sphere>
            )}
            {geometry === 'box' && (
                <Box ref={meshRef} args={[0.7, 0.7, 0.7]}>
                    <meshStandardMaterial color={color} opacity={0.6} transparent />
                </Box>
            )}
            {geometry === 'torus' && (
                <Torus ref={meshRef} args={[0.5, 0.2, 16, 32]}>
                    <meshStandardMaterial color={color} opacity={0.6} transparent />
                </Torus>
            )}
        </Float>
    );
};

const SceneBackground = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
            opacity: 0.4
        }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} />
                <pointLight position={[5, 5, 5]} intensity={0.3} color="#D4AF37" />

                {/* Original floating shapes */}
                <FloatingShape position={[-3, 2, 0]} geometry="box" color="#D4AF37" speed={0.5} />
                <FloatingShape position={[3, -2, -2]} geometry="sphere" color="#A8A29E" speed={0.7} />
                <FloatingShape position={[0, 0, -4]} geometry="torus" color="#78716C" speed={0.6} />

                {/* NEW: Blockchain-themed components */}
                <group position={[-4, 0, -2]} scale={0.6}>
                    <BlockchainCubes />
                </group>

                <group position={[4, 1, -3]} scale={0.5}>
                    <NetworkNodes />
                </group>

                <group position={[-2, -2, -1]} scale={0.8}>
                    <SecurityLock />
                </group>

                <group position={[2, -1, -2]} scale={0.7}>
                    <VerifiedDataCrystals />
                </group>

                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
};

export default SceneBackground;
