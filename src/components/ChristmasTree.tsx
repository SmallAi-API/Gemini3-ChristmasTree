import { useRef } from "react";
import { Group } from "three";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { easing } from "maath";

import Foliage from "./Foliage";
import Ornaments from "./Ornaments";
import Floor from "./Floor";
import FloatingSnow from "./FloatingSnow";

interface ChristmasTreeProps {
  isTreeShape: boolean;
}

function TreeGlow({ isTreeShape }: { isTreeShape: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (materialRef.current && meshRef.current) {
      // Fade in/out based on isTreeShape
      // Faster fade out (0.3s) than fade in (0.8s)
      const targetAlpha = isTreeShape ? 0.25 : 0;
      const smoothTime = isTreeShape ? 0.8 : 0.3;

      easing.damp(
        materialRef.current.uniforms.uAlpha,
        "value",
        targetAlpha,
        smoothTime,
        delta
      );

      // Optimization: Turn off visibility when alpha is effectively 0
      meshRef.current.visible = materialRef.current.uniforms.uAlpha.value > 0.001;

      // Subtle pulse
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 1.0) * 0.05;
      materialRef.current.uniforms.uScale.value = pulse;
    }
  });

  return (
    <Billboard position={[0, 6, 0]}>
      <mesh ref={meshRef}>
        <planeGeometry args={[20, 20]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uAlpha: { value: 0 },
            uColor: { value: new THREE.Color("#ffb6c1") }, // Light Pink
            uScale: { value: 1 },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uAlpha;
            uniform vec3 uColor;
            uniform float uScale;
            varying vec2 vUv;
            void main() {
              float d = distance(vUv, vec2(0.5));
              float glow = 1.0 - smoothstep(0.0, 0.5, d);
              glow = pow(glow, 2.5); // Softer, nicer falloff
              gl_FragColor = vec4(uColor, glow * uAlpha * uScale);
            }
          `}
        />
      </mesh>
    </Billboard>
  );
}

export default function ChristmasTree({ isTreeShape }: ChristmasTreeProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <TreeGlow isTreeShape={isTreeShape} />
      <Floor isTreeShape={isTreeShape} />
      <FloatingSnow isTreeShape={isTreeShape} />

      {/* Background Particles - Increased count & Purple Theme */}
      <Foliage isTreeShape={isTreeShape} count={3000} />

      {/* Star - Top of tree */}
      <Ornaments
        isTreeShape={isTreeShape}
        count={1}
        type="star"
        color="#ffd700"
      />

      {/* Large Baubles - Snowy White/Pink */}
      <Ornaments
        isTreeShape={isTreeShape}
        count={1200}
        type="bauble"
        color="#fff0f5"
      />

      {/* Small Baubles - Pink/Metallic */}
      <Ornaments
        isTreeShape={isTreeShape}
        count={800}
        type="bauble-small"
        color="#ff0033"
      />

      {/* Luxury Diamonds - Middle Section */}
      <Ornaments
        isTreeShape={isTreeShape}
        count={50}
        type="diamond"
        color="#e6e6fa"
      />

      {/* Gift Boxes - Piled at bottom */}
      <Ornaments
        isTreeShape={isTreeShape}
        count={30}
        type="gift"
        color="#f80000"
      />

      {/* Lights - Bright Purple/Pink points */}
      <Ornaments
        isTreeShape={isTreeShape}
        count={400}
        type="light"
        color="#ff1493"
      />
    </group>
  );
}
