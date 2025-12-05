import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 3000;

interface ParticleStreamProps {
  timeScale?: number; // 时间缩放
}

// 粒子流 - 螺旋下落被吞噬的粒子
export function ParticleStream({ timeScale = 1 }: ParticleStreamProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, speeds, colors] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const spd = new Float32Array(PARTICLE_COUNT);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 3 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 2] = r * Math.sin(theta);
      spd[i] = 0.3 + Math.random() * 0.7;

      // 颜色从橙色到白色
      const temp = Math.random();
      col[i * 3] = 1.0;
      col[i * 3 + 1] = 0.5 + temp * 0.5;
      col[i * 3 + 2] = temp * 0.3;
    }
    return [pos, spd, col];
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const scaledDelta = delta * timeScale;
    const pos = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const x = pos[idx],
        z = pos[idx + 2];
      const r = Math.sqrt(x * x + z * z);
      const theta = Math.atan2(z, x);

      // 旋转速度随距离增加
      const angularSpeed = (speeds[i] * 2) / Math.max(r, 1);
      const newTheta = theta + angularSpeed * scaledDelta;

      // 向内螺旋下落
      const fallSpeed = 0.015 * scaledDelta * speeds[i] * (1 + 3 / r);
      const newR = r - fallSpeed;

      if (newR < 1.5) {
        // 重生在外圈
        const spawnR = 8 + Math.random() * 4;
        const spawnTheta = Math.random() * Math.PI * 2;
        pos[idx] = spawnR * Math.cos(spawnTheta);
        pos[idx + 1] = (Math.random() - 0.5) * 0.5;
        pos[idx + 2] = spawnR * Math.sin(spawnTheta);
      } else {
        pos[idx] = newR * Math.cos(newTheta);
        pos[idx + 2] = newR * Math.sin(newTheta);
        pos[idx + 1] *= 0.99;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
