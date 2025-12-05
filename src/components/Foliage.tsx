import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";

const vertexShader = `
  uniform float uTime;
  uniform float uMix;
  
  attribute vec3 treePosition;
  attribute float size;
  attribute float speed;
  attribute float pulse;
  
  varying vec3 vColor;
  
  void main() {
    // Current position mixing
    vec3 pos = mix(position, treePosition, uMix);
    
    // Add breathing/wind effect with pulse offset
    float breathing = sin(uTime * 1.5 + pulse) * 0.05;
    pos.y += breathing;
    
    // Prevent clipping through floor (assume floor is at y=0 local)
    if (pos.y < 0.0) pos.y = 0.0;
    
    // Subtle horizontal drift
    pos.x += sin(uTime * speed + pos.y) * 0.02;
    pos.z += cos(uTime * speed + pos.y) * 0.02;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = size * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Gradient color: Darker Purple -> Muted Pink (Reduced brightness for AdditiveBlending)
    vec3 deepPurple = vec3(0.3, 0.1, 0.3);
    vec3 softPink = vec3(0.7, 0.5, 0.7);
    vec3 sparkle = vec3(0.9, 0.9, 1.0);
    
    // Mix based on height
    float heightFactor = clamp(pos.y / 12.0, 0.0, 1.0);
    vColor = mix(deepPurple, softPink, heightFactor);
    
    // Add sparkles based on speed/randomness
    if (sin(speed * 50.0 + uTime) > 0.95) {
       vColor = mix(vColor, sparkle, 0.7);
    }
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Distance from center of point
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceToCenter > 0.5) discard;

    // Smooth edge glow - slightly tighter center
    float glow = 1.0 - smoothstep(0.1, 0.5, distanceToCenter);
    
    // Output color with reduced opacity
    gl_FragColor = vec4(vColor, glow * 0.5);
  }
`;

interface FoliageProps {
  isTreeShape: boolean;
  count: number;
}

export default function Foliage({ isTreeShape, count }: FoliageProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, treePositions, sizes, speeds, pulses } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const treePositions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const pulses = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // SCATTER: Random Sphere distribution (Galaxy)
      const r = 14 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 6;
      positions[i * 3 + 2] = r * Math.cos(phi);

      // TREE: Cone distribution
      let h = 12 * (1 - Math.cbrt(Math.random()));
      
      // Reduced base radius from 4.5 to 3.8 for a tighter look
      let maxR = 3.8 * (1.0 - h / 12.5);
      
      // FORCE FLAT BOTTOM:
      // Flatten ~8% of particles to the very bottom to create a defined base rim
      if (Math.random() < 0.08) {
          h = 0.2; // Sit just above floor
          maxR = 3.8; // Base radius
          // Push to edge for rim definition (0.8 - 1.0 of radius)
          const coneR = maxR * (0.8 + Math.random() * 0.2);
          const coneTheta = Math.random() * 2 * Math.PI;
          
          treePositions[i * 3] = coneR * Math.cos(coneTheta);
          treePositions[i * 3 + 1] = h;
          treePositions[i * 3 + 2] = coneR * Math.sin(coneTheta);
      } else {
          // Standard distribution
          const coneR = Math.sqrt(Math.random()) * maxR;
          const coneTheta = Math.random() * 2 * Math.PI;

          treePositions[i * 3] = coneR * Math.cos(coneTheta);
          treePositions[i * 3 + 1] = h;
          treePositions[i * 3 + 2] = coneR * Math.sin(coneTheta);
      }

      sizes[i] = Math.random() * 0.6 + 0.2;
      speeds[i] = Math.random() * 0.5 + 0.5;
      pulses[i] = Math.random() * Math.PI * 2;
    }

    return { positions, treePositions, sizes, speeds, pulses };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMix: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;

      // Faster scatter transition (0.6s) than assemble (1.0s)
      easing.damp(
        material.uniforms.uMix,
        "value",
        isTreeShape ? 1 : 0,
        isTreeShape ? 1.0 : 0.6,
        delta
      );
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-treePosition"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
          args={[treePositions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-speed"
          count={speeds.length}
          array={speeds}
          itemSize={1}
          args={[speeds, 1]}
        />
        <bufferAttribute
          attach="attributes-pulse"
          count={pulses.length}
          array={pulses}
          itemSize={1}
          args={[pulses, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
