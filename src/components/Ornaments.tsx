import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";

interface OrnamentsProps {
  isTreeShape: boolean;
  count: number;
  type: "bauble" | "bauble-small" | "gift" | "star" | "light" | "diamond";
  color: string;
}

const tempObject = new THREE.Object3D();
const tempPos = new THREE.Vector3();

// --- Helper Functions ---

function createGiftTexture(primaryColor: string, ribbonColor: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // 1. Fill Background (Paper)
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Add some subtle texture/noise to paper
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      2,
      2
    );
  }

  // 3. Draw Ribbon (Cross)
  const ribbonWidth = canvas.width * 0.15; // 15% width
  const center = canvas.width / 2;

  ctx.fillStyle = ribbonColor;
  ctx.fillRect(center - ribbonWidth / 2, 0, ribbonWidth, canvas.height);
  ctx.fillRect(0, center - ribbonWidth / 2, canvas.width, ribbonWidth);

  // 4. Add Gold/Metallic edge to ribbon
  ctx.strokeStyle = "#ffd700"; // Gold
  ctx.lineWidth = 2;
  ctx.strokeRect(center - ribbonWidth / 2, 0, ribbonWidth, canvas.height);
  ctx.strokeRect(0, center - ribbonWidth / 2, canvas.width, ribbonWidth);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function createStarGeometry(points = 5, innerRadius = 0.5, outerRadius = 1) {
  const shape = new THREE.Shape();
  const angleStep = Math.PI / points;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * angleStep - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 5,
  });
  geom.center();
  return geom;
}

export default function Ornaments({
  isTreeShape,
  count,
  type,
  color,
}: OrnamentsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Define weight for floating animation based on type
  // lighter items float more
  const weight = useMemo(() => {
    switch (type) {
      case "light":
        return 0.9;
      case "star":
        return 0.7;
      case "bauble-small":
        return 0.8;
      case "bauble":
        return 0.6;
      case "diamond":
        return 0.5;
      case "gift":
        return 0.3; // Gifts are heavy
      default:
        return 0.5;
    }
  }, [type]);

  const { scatterData, treeData } = useMemo(() => {
    const scatterData = [];
    const treeData = [];

    for (let i = 0; i < count; i++) {
      // SCATTER: Random Sphere distribution
      const r = 24 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      scatterData.push({
        position: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) + 6,
          r * Math.cos(phi)
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          0
        ),
        scale: Math.random() * 0.5 + 0.5,
      });

      // TREE: Distribution based on type
      if (type === "star") {
        treeData.push({
          position: new THREE.Vector3(0, 12, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: 3.5,
        });
      } else if (type === "gift") {
        // Gifts: Piled TIGHTLY under the tree
        // Previous radius was too wide (3.5+), making it look scattered.
        // New radius: 1.5 to 4.5 (Clustered around the base)
        const radiusOffset = Math.random() * 3.0;
        const giftR = 1.5 + radiusOffset;
        const giftTheta = Math.random() * 2 * Math.PI;
        const giftScale = Math.random() * 0.6 + 0.6;

        // Piling logic
        const boxHeight = 0.3 * giftScale;
        let yPos = boxHeight / 2;

        // Stack layers logic - slightly more aggressive stacking for tighter piles
        if (giftR < 3.0 && Math.random() > 0.3) {
          yPos += boxHeight;
          if (Math.random() > 0.5) yPos += boxHeight;
        } else if (giftR < 4.0 && Math.random() > 0.6) {
          yPos += boxHeight * 0.8;
        }

        // Add slight vertical jitter
        yPos += Math.random() * 0.05;

        treeData.push({
          position: new THREE.Vector3(
            giftR * Math.cos(giftTheta),
            yPos,
            giftR * Math.sin(giftTheta)
          ),
          rotation: new THREE.Euler(
            (Math.random() - 0.5) * 0.8,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.8
          ),
          scale: giftScale,
        });
      } else if (type === "diamond") {
        // Diamonds: Concentrated in the middle section (Luxury belt)
        // Height: 3.0 to 9.0
        const h = 3.0 + Math.random() * 6.0;

        // Base radius 3.8
        const maxR = 3.8 * (1.0 - h / 12.0);

        // On the surface, slightly protruding
        const surfaceR = maxR * 1.05;
        const theta = Math.random() * 2 * Math.PI;

        treeData.push({
          position: new THREE.Vector3(
            surfaceR * Math.cos(theta),
            h,
            surfaceR * Math.sin(theta)
          ),
          rotation: new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ),
          scale: Math.random() * 0.3 + 0.7, // Larger than baubles
        });
      } else {
        // Baubles: Dense Cone
        const h = Math.random() * 11.5;

        // Adjusted Base radius to 3.8 to match Foliage
        const maxR = 3.8 * (1.0 - h / 12.0);

        // To make it solid, we place them on the surface mainly
        const surfaceR = maxR * (0.85 + Math.random() * 0.25);
        const theta = Math.random() * 2 * Math.PI;

        treeData.push({
          position: new THREE.Vector3(
            surfaceR * Math.cos(theta),
            h + 0.5, // Lift off floor slightly
            surfaceR * Math.sin(theta)
          ),
          rotation: new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            0
          ),
          scale: Math.random() * 0.5 + 0.5,
        });
      }
    }
    return { scatterData, treeData };
  }, [count, type]);

  useLayoutEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < count; i++) {
        tempObject.position.copy(scatterData[i].position);
        tempObject.rotation.copy(scatterData[i].rotation);
        tempObject.scale.setScalar(scatterData[i].scale);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [count, scatterData]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const targetState = isTreeShape ? 1 : 0;
    if (typeof meshRef.current.userData.mix === "undefined")
      meshRef.current.userData.mix = 0;

    // Faster scatter transition (0.5s) than assemble (0.9s)
    const smoothTime = isTreeShape ? 0.9 : 0.5;

    easing.damp(
      meshRef.current.userData,
      "mix",
      targetState,
      smoothTime,
      delta
    );
    const newMix = meshRef.current.userData.mix;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      // Calculate floating wave effect
      // Only apply when scattered (mix < 1)
      // Weight determines how much it floats
      const wave = Math.sin(time * 0.5 + i) * weight * (1 - newMix);
      const waveOffset = new THREE.Vector3(wave * 0.8, wave * 0.5, wave * 0.8);

      // Interpolate position
      tempPos.lerpVectors(
        scatterData[i].position,
        treeData[i].position,
        newMix
      );

      // Apply wave offset
      tempPos.add(waveOffset);
      tempObject.position.copy(tempPos);

      if (type === "gift") {
        tempObject.rotation.x =
          scatterData[i].rotation.x * (1 - newMix) +
          treeData[i].rotation.x * newMix;
        tempObject.rotation.y =
          scatterData[i].rotation.y * (1 - newMix) +
          treeData[i].rotation.y * newMix;
        tempObject.rotation.z =
          scatterData[i].rotation.z * (1 - newMix) +
          treeData[i].rotation.z * newMix;
        tempObject.scale.setScalar(
          scatterData[i].scale * (1 - newMix) + treeData[i].scale * newMix
        );
      } else {
        // Spin effect when flying
        const spinSpeed = (1 - newMix) * 2.0;
        tempObject.rotation.x = scatterData[i].rotation.x + time * spinSpeed;
        tempObject.rotation.y = scatterData[i].rotation.y + time * spinSpeed;

        // Stabilize rotation when in tree form
        if (newMix > 0.9) {
          tempObject.rotation.x = THREE.MathUtils.lerp(
            tempObject.rotation.x,
            treeData[i].rotation.x,
            newMix * 0.1
          );
          tempObject.rotation.y = THREE.MathUtils.lerp(
            tempObject.rotation.y,
            treeData[i].rotation.y,
            newMix * 0.1
          );

          if (type === "diamond") {
            // Slow elegant spin for diamonds even when in tree
            tempObject.rotation.y += time * 0.1;
          }
        }

        const scale = scatterData[i].scale;
        tempObject.scale.setScalar(scale);
      }

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    if (type === "bauble") return new THREE.SphereGeometry(0.15, 32, 32);
    if (type === "bauble-small") return new THREE.SphereGeometry(0.08, 24, 24);
    if (type === "gift") return new THREE.BoxGeometry(0.3, 0.3, 0.3);
    if (type === "star") return createStarGeometry(5, 0.1, 0.25);
    if (type === "light") return new THREE.SphereGeometry(0.08, 16, 16);
    if (type === "diamond") return new THREE.OctahedronGeometry(0.2);
    return new THREE.SphereGeometry(0.2);
  }, [type]);

  const material = useMemo(() => {
    if (type === "light" || type === "star") {
      return new THREE.MeshStandardMaterial({
        color: color,
        emissive: type === "star" ? "#ffd700" : color,
        // Reduced intensity: Star 2.0->1.5, Light 10.0->3.0
        emissiveIntensity: type === "star" ? 1.5 : 3.0,
        toneMapped: false,
        roughness: 0.2,
        metalness: 0.8,
      });
    }

    if (type === "gift") {
      // White and Pink Theme for Gifts
      const texture = createGiftTexture(color, "#ffb6c1"); // White box, pink ribbon
      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.1,
      });
    }

    if (type === "diamond") {
      return new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 1.0,
        roughness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        // Reduced envMapIntensity: 2.0->1.0
        envMapIntensity: 1.0,
        transmission: 0.2,
        opacity: 0.9,
        transparent: true,
      });
    }

    // Baubles - High Gloss
    return new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: 0.9,
      // Increased roughness: 0.1->0.2, Reduced envMapIntensity: 1.5->0.8
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.8,
    });
  }, [type, color]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
    />
  );
}
