import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";

interface FloorProps {
  isTreeShape: boolean;
}

// 创建雪花图案纹理
function createSnowflakeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // 清空背景（确保透明）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制大雪花
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.lineCap = "round";

  // 绘制6瓣雪花
  const drawSnowflake = (x: number, y: number, size: number, alpha: number) => {
    ctx.save();
    ctx.translate(x, y);
    // Warmer gold/cream tint for luxury feel
    ctx.strokeStyle = `rgba(255, 240, 220, ${alpha})`;
    ctx.lineWidth = 2;

    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 3) * i);

      // 主干
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -size);
      ctx.stroke();

      // 分支
      const branchPos = [0.3, 0.5, 0.7];
      branchPos.forEach((pos) => {
        const y = -size * pos;
        const branchLen = size * 0.25 * (1 - pos * 0.5);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(-branchLen, y - branchLen * 0.6);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(branchLen, y - branchLen * 0.6);
        ctx.stroke();
      });

      ctx.restore();
    }

    // 中心点
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.fill();

    ctx.restore();
  };

  // 绘制中央大雪花
  drawSnowflake(centerX, centerY, 300, 0.25);

  // 绘制周围小雪花
  const smallSnowflakes = [
    { x: 200, y: 200, size: 80 },
    { x: 824, y: 200, size: 80 },
    { x: 200, y: 824, size: 80 },
    { x: 824, y: 824, size: 80 },
    { x: 512, y: 150, size: 60 },
    { x: 512, y: 874, size: 60 },
    { x: 150, y: 512, size: 60 },
    { x: 874, y: 512, size: 60 },
  ];

  smallSnowflakes.forEach((sf) => {
    drawSnowflake(sf.x, sf.y, sf.size, 0.12);
  });

  // 添加一些散落的雪点
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function Floor({ isTreeShape }: FloorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const texture = useMemo(() => createSnowflakeTexture(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // 缓动动画：树形态时显示地板
    const targetOpacity = isTreeShape ? 1 : 0;
    const targetScale = isTreeShape ? 1 : 0.5;
    
    // Speed up scatter transition
    const smoothTime = isTreeShape ? 0.8 : 0.4;

    easing.damp(materialRef.current, "opacity", targetOpacity, smoothTime, delta);
    easing.damp(meshRef.current.scale, "x", targetScale, smoothTime, delta);
    easing.damp(meshRef.current.scale, "z", targetScale, smoothTime, delta);
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.05, 0]}
      receiveShadow
      scale={[0.5, 0.5, 1]}>
      <circleGeometry args={[14, 64]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0}
        roughness={0.4}
        metalness={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
