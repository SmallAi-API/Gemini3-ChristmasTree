import * as THREE from "three";

// 光子环 - 多层极亮细环
export function PhotonRing() {
  const rings = [
    { radius: 1.25, thickness: 0.025, opacity: 1.0 },
    { radius: 1.30, thickness: 0.02, opacity: 0.8 },
    { radius: 1.35, thickness: 0.015, opacity: 0.6 },
    { radius: 1.40, thickness: 0.01, opacity: 0.4 },
  ];

  return (
    <group rotation-x={Math.PI / 2}>
      {rings.map((ring, i) => (
        <mesh key={i}>
          <torusGeometry args={[ring.radius, ring.thickness, 16, 100]} />
          <meshBasicMaterial
            color="#ffffff"
            toneMapped={false}
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
