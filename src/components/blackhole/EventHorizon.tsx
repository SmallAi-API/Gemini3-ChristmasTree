import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 事件视界 - 黑色球体 + 菲涅尔边缘光
export function EventHorizon() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uTime: { value: 0 },
          uGlowColor: { value: new THREE.Color("#ff4400") },
        }}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uGlowColor;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
            // 脉动效果
            float pulse = 0.5 + 0.5 * sin(uTime * 0.5);
            vec3 glow = uGlowColor * fresnel * (0.4 + pulse * 0.2);
            vec3 core = vec3(0.0);
            gl_FragColor = vec4(core + glow, 1.0);
          }
        `}
      />
    </mesh>
  );
}
