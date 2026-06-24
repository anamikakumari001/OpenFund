"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Sphere, Line } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const NODES = [
  { id: "center", label: "OpenFund", pos: [0, 0, 0] as [number, number, number], color: "#38BDF8", size: 0.4 },
  { id: "react", label: "react", pos: [3, 1, 0] as [number, number, number], color: "#8B5CF6", size: 0.25 },
  { id: "next", label: "next.js", pos: [-2.5, 2, 1] as [number, number, number], color: "#22C55E", size: 0.22 },
  { id: "tailwind", label: "tailwind", pos: [1, -2.5, 0] as [number, number, number], color: "#F59E0B", size: 0.2 },
  { id: "prisma", label: "prisma", pos: [-3, -1, -1] as [number, number, number], color: "#38BDF8", size: 0.2 },
  { id: "stellar", label: "stellar", pos: [2, 2.5, -1] as [number, number, number], color: "#8B5CF6", size: 0.22 },
  { id: "vite", label: "vite", pos: [-1.5, -3, 1] as [number, number, number], color: "#22C55E", size: 0.18 },
  { id: "gsap", label: "gsap", pos: [3.5, -1.5, 1] as [number, number, number], color: "#EF4444", size: 0.18 },
];

function NetworkScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <group ref={groupRef}>
      {NODES.map((node) => (
        <group key={node.id} position={node.pos}>
          <Sphere args={[node.size, 16, 16]}>
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={0.5}
              roughness={0.2}
              metalness={0.8}
            />
          </Sphere>
          {/* Glow sphere */}
          <Sphere args={[node.size * 1.5, 8, 8]}>
            <meshStandardMaterial
              color={node.color}
              transparent
              opacity={0.08}
              emissive={node.color}
              emissiveIntensity={0.3}
            />
          </Sphere>
        </group>
      ))}

      {/* Lines connecting to center */}
      {NODES.slice(1).map((node) => (
        <Line
          key={`line-${node.id}`}
          points={[NODES[0].pos, node.pos]}
          color={node.color}
          transparent
          opacity={0.2}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

function NetworkVizInner() {
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 55 }} className="w-full h-full" gl={{ alpha: true }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#38BDF8" />
      <pointLight position={[-5, -5, -5]} intensity={1} color="#8B5CF6" />
      <NetworkScene />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate={false}
        minDistance={5}
        maxDistance={15}
      />
    </Canvas>
  );
}

export function NetworkViz() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Live Open Source Network
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            The interconnected ecosystem of projects, contributors, and funding flowing
            through OpenFund in real time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative h-[500px] rounded-3xl border border-white/10 bg-slate-950/80 overflow-hidden"
        >
          <NetworkVizInner />

          {/* Overlay stats */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
            {[
              { label: "Active Nodes", value: "5,200+", color: "sky" },
              { label: "Fund Flows/hr", value: "840", color: "violet" },
              { label: "Contributors", value: "18k+", color: "green" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-sm"
              >
                <span className={`text-sm font-bold ${stat.color === "sky" ? "text-sky-400" : stat.color === "violet" ? "text-violet-400" : "text-green-400"}`}>
                  {stat.value}
                </span>
                <span className="text-xs text-slate-400">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="absolute top-4 right-4 text-xs text-slate-500">
            Drag to rotate • Scroll to zoom
          </div>
        </motion.div>
      </div>
    </section>
  );
}
