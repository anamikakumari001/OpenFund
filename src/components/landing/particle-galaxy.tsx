/* eslint-disable react-hooks/purity */
"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function Stars({ count = 3000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 8 + 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      if (t < 0.4) {
        col[i * 3] = 0.22; col[i * 3 + 1] = 0.74; col[i * 3 + 2] = 0.97;
      } else if (t < 0.7) {
        col[i * 3] = 0.55; col[i * 3 + 1] = 0.36; col[i * 3 + 2] = 0.96;
      } else {
        col[i * 3] = 0.13; col[i * 3 + 1] = 0.77; col[i * 3 + 2] = 0.37;
      }
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.04;
    ref.current.rotation.x = mouse.y * 0.1;
    ref.current.rotation.z = mouse.x * 0.1;
  });

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3}>
      <PointMaterial
        vertexColors
        size={0.04}
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </Points>
  );
}

function Connections({ count = 60 }: { count?: number }) {
  const ref = useRef<THREE.LineSegments>(null);
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const a = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      const b = new THREE.Vector3(
        a.x + (Math.random() - 0.5) * 3,
        a.y + (Math.random() - 0.5) * 3,
        a.z + (Math.random() - 0.5) * 3
      );
      points.push(a, b);
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.015) * 0.1;
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#38BDF8" transparent opacity={0.08} />
    </lineSegments>
  );
}

function FloatingNodes({ count = 20 }: { count?: number }) {
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const positions = useMemo(() =>
    Array.from({ length: count }, () => [
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8,
    ] as [number, number, number]),
    [count]
  );

  useFrame((state) => {
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.y = positions[i][1] + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.2;
      mesh.rotation.x = state.clock.elapsedTime * 0.3 + i;
      mesh.rotation.y = state.clock.elapsedTime * 0.2 + i;
    });
  });

  return (
    <>
      {positions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          ref={(el) => { if (el) meshRefs.current[i] = el; }}
        >
          <octahedronGeometry args={[0.06]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#38BDF8" : i % 3 === 1 ? "#8B5CF6" : "#22C55E"}
            emissive={i % 3 === 0 ? "#38BDF8" : i % 3 === 1 ? "#8B5CF6" : "#22C55E"}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </>
  );
}

export function ParticleGalaxy() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      className="absolute inset-0"
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#38BDF8" />
      <pointLight position={[-5, -5, 5]} intensity={0.5} color="#8B5CF6" />
      <Stars />
      <Connections />
      <FloatingNodes />
    </Canvas>
  );
}
