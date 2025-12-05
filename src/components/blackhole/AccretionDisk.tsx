import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AccretionDiskProps {
  timeScale?: number;    // 时间缩放 (0.1 - 3.0)
  intensity?: number;    // 亮度强度 (0.5 - 2.0)
}

// 吸积盘 - 核心视觉元素
export function AccretionDisk({ timeScale = 1, intensity = 1 }: AccretionDiskProps) {
  const diskRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const upperArcRef = useRef<THREE.Mesh>(null);
  const lowerArcRef = useRef<THREE.Mesh>(null);
  const innerDiskRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    // 使用自定义时间累积，受 timeScale 影响
    timeRef.current += delta * timeScale;
    const time = timeRef.current;

    if (diskRef.current) {
      diskRef.current.rotation.z = time * 0.3;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uIntensity.value = intensity;
    }

    // 光弧脉动
    if (upperArcRef.current && lowerArcRef.current) {
      const pulse = 0.5 + Math.sin(time * 2) * 0.1;
      const mat1 = upperArcRef.current.material as THREE.MeshBasicMaterial;
      const mat2 = lowerArcRef.current.material as THREE.MeshBasicMaterial;
      mat1.opacity = pulse * intensity;
      mat2.opacity = pulse * intensity;
    }

    // 内盘脉动
    if (innerDiskRef.current) {
      const innerPulse = 0.7 + Math.sin(time * 3) * 0.15;
      const mat = innerDiskRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = innerPulse * intensity;
    }
  });

  return (
    <group>
      {/* 主吸积盘 */}
      <mesh ref={diskRef} rotation-x={Math.PI / 2}>
        <ringGeometry args={[1.5, 8, 128, 1]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            uTime: { value: 0 },
            uIntensity: { value: intensity },
            uInnerColor: { value: new THREE.Color("#fff8e0") },
            uOuterColor: { value: new THREE.Color("#ff4400") },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform float uIntensity;
            uniform vec3 uInnerColor;
            uniform vec3 uOuterColor;
            varying vec2 vUv;

            float noise(vec2 p) {
              return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }

            void main() {
              float dist = length(vUv - 0.5) * 2.0;
              vec3 color = mix(uInnerColor, uOuterColor, dist);

              // 螺旋纹理
              float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
              float spiral = sin(angle * 12.0 - dist * 15.0 + uTime * 3.0) * 0.3 + 0.7;

              // 噪声扰动
              float n = noise(vUv * 50.0 + uTime * 0.5);

              // 温度变化
              float temperature = 1.0 - smoothstep(0.0, 1.0, dist);
              color *= 1.0 + temperature * 0.5;

              float alpha = (1.0 - dist) * spiral * (0.7 + n * 0.3);
              alpha *= smoothstep(0.0, 0.1, 1.0 - dist);

              gl_FragColor = vec4(color * 1.8 * uIntensity, alpha * uIntensity);
            }
          `}
        />
      </mesh>

      {/* 上弯光弧 */}
      <mesh ref={upperArcRef} position-y={0.6} rotation-x={Math.PI / 2 + 0.25}>
        <torusGeometry args={[4.5, 0.4, 16, 100]} />
        <meshBasicMaterial
          color="#ff5500"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 下弯光弧 */}
      <mesh ref={lowerArcRef} position-y={-0.6} rotation-x={Math.PI / 2 - 0.25}>
        <torusGeometry args={[4.5, 0.4, 16, 100]} />
        <meshBasicMaterial
          color="#ff5500"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 内部热盘 */}
      <mesh ref={innerDiskRef} rotation-x={Math.PI / 2}>
        <ringGeometry args={[1.2, 2, 64, 1]} />
        <meshBasicMaterial
          color="#fffaf0"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
