import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GravityWaveProps {
  trigger: number; // 触发时间戳，改变时触发新波
}

// 波纹层配置
const WAVE_LAYERS = 8; // 同心圆层数
const MAX_CONCURRENT_WAVES = 3; // 最大同时存在的波组数

interface WaveData {
  startTime: number;
  active: boolean;
}

// 增强版引力波效果 - 壮观的同心圆扩散波纹
export function GravityWave({ trigger }: GravityWaveProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lastTriggerRef = useRef(0);

  // 波组数据
  const waveGroupsRef = useRef<WaveData[]>(
    Array.from({ length: MAX_CONCURRENT_WAVES }, () => ({
      startTime: 0,
      active: false,
    }))
  );

  // 创建着色器材质
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uColor1: { value: new THREE.Color("#00ffff") },
        uColor2: { value: new THREE.Color("#0066ff") },
        uColor3: { value: new THREE.Color("#ff00ff") },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vRadius;

        void main() {
          vUv = uv;
          vRadius = length(position.xy);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;

        varying vec2 vUv;
        varying float vRadius;

        void main() {
          // 基于进度的颜色渐变
          vec3 color = mix(uColor1, uColor2, uProgress);
          color = mix(color, uColor3, uProgress * uProgress);

          // 波纹边缘发光效果
          float edge = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
          float glow = edge * (1.0 - uProgress);

          // 脉动效果
          float pulse = sin(uTime * 10.0 + vRadius * 2.0) * 0.2 + 0.8;

          float alpha = glow * pulse * (1.0 - uProgress * uProgress);

          gl_FragColor = vec4(color * 1.5, alpha * 0.8);
        }
      `,
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // 检测新触发
    if (trigger !== lastTriggerRef.current && trigger > 0) {
      lastTriggerRef.current = trigger;
      // 找到一个非活动的波组
      const inactiveWaveGroup = waveGroupsRef.current.find((w) => !w.active);
      if (inactiveWaveGroup) {
        inactiveWaveGroup.startTime = time;
        inactiveWaveGroup.active = true;
      }
    }

    // 更新每个波组
    const children = groupRef.current.children;

    waveGroupsRef.current.forEach((waveGroup, groupIndex) => {
      const startIdx = groupIndex * WAVE_LAYERS;

      if (waveGroup.active) {
        const elapsed = time - waveGroup.startTime;
        const duration = 4; // 波持续4秒
        const baseProgress = elapsed / duration;

        if (baseProgress >= 1) {
          waveGroup.active = false;
          // 隐藏这组所有波
          for (let i = 0; i < WAVE_LAYERS; i++) {
            const mesh = children[startIdx + i] as THREE.Mesh;
            if (mesh) mesh.visible = false;
          }
        } else {
          // 更新每层波纹
          for (let i = 0; i < WAVE_LAYERS; i++) {
            const mesh = children[startIdx + i] as THREE.Mesh;
            if (!mesh) continue;

            // 每层有延迟
            const layerDelay = i * 0.08;
            const layerProgress = Math.max(0, (elapsed - layerDelay) / (duration - layerDelay));

            if (layerProgress <= 0) {
              mesh.visible = false;
              continue;
            }

            mesh.visible = true;

            // 非线性扩散 - 开始快后来慢
            const easeOut = 1 - Math.pow(1 - layerProgress, 3);
            const scale = 1.5 + easeOut * 25;
            mesh.scale.set(scale, scale, 1);

            // 更新材质
            const material = mesh.material as THREE.ShaderMaterial;
            if (material.uniforms) {
              material.uniforms.uTime.value = time;
              material.uniforms.uProgress.value = layerProgress;
            }

            // 透明度 - 内层更亮
            const layerOpacity = (1 - layerProgress) * (1 - i / WAVE_LAYERS * 0.5);
            material.opacity = layerOpacity;
          }
        }
      } else {
        // 隐藏非活动波组
        for (let i = 0; i < WAVE_LAYERS; i++) {
          const mesh = children[startIdx + i] as THREE.Mesh;
          if (mesh) mesh.visible = false;
        }
      }
    });
  });

  // 创建所有波纹环
  const rings = useMemo(() => {
    const result = [];
    for (let group = 0; group < MAX_CONCURRENT_WAVES; group++) {
      for (let layer = 0; layer < WAVE_LAYERS; layer++) {
        // 不同层使用不同的环粗细
        const thickness = 0.03 + layer * 0.01;
        result.push(
          <mesh key={`${group}-${layer}`} visible={false} rotation-x={Math.PI / 2}>
            <torusGeometry args={[1, thickness, 16, 128]} />
            <shaderMaterial
              attach="material"
              args={[shaderMaterial]}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              uniforms-uTime-value={0}
              uniforms-uProgress-value={0}
              uniforms-uColor1-value={new THREE.Color("#00ffff")}
              uniforms-uColor2-value={new THREE.Color("#0066ff")}
              uniforms-uColor3-value={new THREE.Color("#ff00ff")}
            />
          </mesh>
        );
      }
    }
    return result;
  }, [shaderMaterial]);

  return (
    <group ref={groupRef}>
      {rings}

      {/* 中心爆发光效 */}
      <CenterBurst trigger={trigger} />
    </group>
  );
}

// 中心爆发效果
function CenterBurst({ trigger }: { trigger: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastTriggerRef = useRef(0);
  const activeRef = useRef(false);
  const startTimeRef = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    // 检测触发
    if (trigger !== lastTriggerRef.current && trigger > 0) {
      lastTriggerRef.current = trigger;
      activeRef.current = true;
      startTimeRef.current = time;
    }

    if (activeRef.current) {
      const elapsed = time - startTimeRef.current;
      const duration = 1.5;
      const progress = elapsed / duration;

      if (progress >= 1) {
        activeRef.current = false;
        meshRef.current.visible = false;
      } else {
        meshRef.current.visible = true;

        // 快速扩张然后消失
        const scale = 1 + Math.pow(progress, 0.5) * 8;
        meshRef.current.scale.set(scale, scale, scale);

        // 透明度
        const material = meshRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = (1 - progress) * 0.6;
      }
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
