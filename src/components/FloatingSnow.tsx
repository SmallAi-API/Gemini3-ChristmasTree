import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";

interface FloatingSnowProps {
  isTreeShape: boolean;
}

const snowVertexShader = `
  uniform float uTime;
  uniform float uHeight; 
  
  attribute float size;
  attribute float speed;
  attribute vec3 randomOffset;
  
  varying float vOpacity;
  
  void main() {
    vec3 pos = position;
    
    // Falling animation
    float fallOffset = uTime * speed;
    // Wrap y around uHeight. 
    // We want it to fall from top (uHeight) to bottom (0).
    // Original pos.y is 0..uHeight.
    // pos.y - fallOffset will go negative.
    // mod(..., uHeight) keeps it in range 0..uHeight.
    pos.y = mod(position.y - fallOffset, uHeight);
    
    // Horizontal drift
    pos.x += sin(uTime * 0.5 + randomOffset.x) * 0.5;
    pos.z += cos(uTime * 0.3 + randomOffset.z) * 0.5;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = size * (300.0 / -mvPosition.z);
    
    // Soft fade at top and bottom boundaries to avoid popping
    float normalizedY = pos.y / uHeight;
    // Fade out near 0 and 1
    vOpacity = smoothstep(0.0, 0.1, normalizedY) * (1.0 - smoothstep(0.9, 1.0, normalizedY));
  }
`;

const snowFragmentShader = `
  uniform vec3 uColor;
  uniform float uGlobalOpacity;
  
  varying float vOpacity;
  
  void main() {
    // Soft snowflake shape (circle with soft edge)
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float r = length(xy);
    if (r > 0.5) discard;
    
    // Inner core brighter
    float glow = 1.0 - smoothstep(0.0, 0.5, r);
    glow = pow(glow, 1.5);
    
    gl_FragColor = vec4(uColor, glow * uGlobalOpacity * vOpacity);
  }
`;

export default function FloatingSnow({ isTreeShape }: FloatingSnowProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const count = 300; // Number of snowflakes
  const height = 18; // Height of the snow volume

  const { positions, sizes, speeds, randomOffsets } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const randomOffsets = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Area: x[-8, 8], y[0, height], z[-8, 8]
      positions[i * 3] = (Math.random() - 0.5) * 16; 
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;

      sizes[i] = Math.random() * 0.6 + 0.3; // Size variation
      speeds[i] = Math.random() * 0.8 + 0.2; // Speed variation
      
      randomOffsets[i * 3] = Math.random() * 100;
      randomOffsets[i * 3 + 1] = Math.random() * 100;
      randomOffsets[i * 3 + 2] = Math.random() * 100;
    }

    return { positions, sizes, speeds, randomOffsets };
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Only show snow when isTreeShape is true
      const targetOpacity = isTreeShape ? 0.8 : 0; 
      easing.damp(material.uniforms.uGlobalOpacity, "value", targetOpacity, 1.0, delta);
    }
  });

  return (
    <points ref={pointsRef} position={[0, -2, 0]}> {/* Position matched with ChristmasTree base */}
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-speed"
          args={[speeds, 1]}
        />
        <bufferAttribute
          attach="attributes-randomOffset"
          args={[randomOffsets, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={snowVertexShader}
        fragmentShader={snowFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uHeight: { value: height },
          uColor: { value: new THREE.Color("#ffb6c1") }, // Light Pink
          uGlobalOpacity: { value: 0 },
        }}
      />
    </points>
  );
}
