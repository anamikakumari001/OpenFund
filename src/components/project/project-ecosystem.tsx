/* eslint-disable react-hooks/purity */
"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Line } from "@react-three/drei";
import * as THREE from "three";
import type { ProjectWithDetails } from "@/types";

interface EcosystemNode {
  id: string;
  label: string;
  pos: [number, number, number];
  color: string;
  size: number;
  type: "center" | "contributor" | "sponsor" | "milestone" | "issue";
}

function EcosystemScene({ project }: { project: ProjectWithDetails }) {
  const groupRef = useRef<THREE.Group>(null);

  const nodes: EcosystemNode[] = [
    {
      id: "center",
      label: project.name,
      pos: [0, 0, 0],
      color: "#2563EB",
      size: 0.5,
      type: "center",
    },
    ...project.contributors.slice(0, 6).map((c, i) => ({
      id: c.id,
      label: c.githubLogin,
      pos: [
        Math.cos((i / 6) * Math.PI * 2) * 2.5,
        Math.sin((i / 6) * Math.PI * 2) * 2.5,
        (Math.random() - 0.5) * 1,
      ] as [number, number, number],
      color: "#6B7280",
      size: 0.2,
      type: "contributor" as const,
    })),
    ...project.milestones.slice(0, 4).map((m, i) => ({
      id: m.id,
      label: m.title.slice(0, 15),
      pos: [
        Math.cos((i / 4) * Math.PI * 2 + 0.5) * 4,
        Math.sin((i / 4) * Math.PI * 2 + 0.5) * 4,
        (Math.random() - 0.5) * 1.5,
      ] as [number, number, number],
      color: "#16a34a",
      size: 0.15,
      type: "milestone" as const,
    })),
  ];

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.06;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node) => (
        <group key={node.id} position={node.pos}>
          <Sphere args={[node.size, 16, 16]}>
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={0.2}
              roughness={0.4}
              metalness={0.3}
            />
          </Sphere>
          {node.type !== "center" && (
            <Line
              points={[[0, 0, 0], nodes[0].pos.map((v, i) => v - node.pos[i]) as [number, number, number]]}
              color="#E5E7EB"
              transparent
              opacity={0.6}
              lineWidth={1}
            />
          )}
        </group>
      ))}
    </group>
  );
}

export function ProjectEcosystem({ project }: { project: ProjectWithDetails }) {
  return (
    <div className="h-[400px] rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
      <Canvas camera={{ position: [0, 0, 10], fov: 55 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.6} color="#ffffff" />
        <pointLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <EcosystemScene project={project} />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={15} />
      </Canvas>
    </div>
  );
}
