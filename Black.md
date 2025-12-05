````markdown
# 🕳️ Interstellar Black Hole

基于 React Three Fiber 的《星际穿越》风格黑洞可视化页面。

![Preview](preview.gif)

## ✨ 特性

- **吸积盘光环** - 橙红色旋转光盘 + 引力透镜弯曲效果
- **光子环** - 极亮的白色细环
- **粒子物质流** - 螺旋下落被吞噬的粒子
- **扭曲星空** - 被引力弯曲的背景
- **电影级后期** - Bloom + 色差 + 暗角
- **沉浸交互** - 环绕观察、滚轮缩放

## 🛠️ 技术栈

基于本项目所有技术栈完成

## 🚀 快速开始

```bash
pnpm install
pnpm dev
```
````

## 📁 项目结构

```
需要在page页面创造一个新的页面完成
```

---

## 🎨 生成提示词 (Prompt)

### 角色设定

你是一名精通 React Three Fiber 和 GLSL 着色器的 3D 可视化工程师。

### 任务目标

实现一个《星际穿越》风格的黑洞展示页面，追求视觉震撼而非物理精确。

### 技术栈

React 19 + TypeScript + Three.js 0.181 + @react-three/fiber 9.4 + @react-three/drei 10.7 + @react-three/postprocessing 3.0

---

### 一、视觉构成

```
场景从外到内：
1. 深空星云背景
2. 扭曲的星空粒子
3. 橙红色旋转吸积盘（正面+上下弯曲的"光弧"）
4. 极亮白色光子环
5. 中心绝对黑暗的事件视界
6. 螺旋下落的粒子流
```

---

### 二、核心组件

#### 1. 事件视界 (EventHorizon)

```tsx
// 黑色球体 + 菲涅尔边缘光
<mesh>
  <sphereGeometry args={[1, 64, 64]} />
  <shaderMaterial
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
      uniform vec3 uGlowColor;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
        vec3 glow = uGlowColor * fresnel * 0.5;
        vec3 core = vec3(0.0);
        gl_FragColor = vec4(core + glow, 1.0);
      }
    `}
  />
</mesh>
```

---

#### 2. 吸积盘 (AccretionDisk) ⭐ 核心视觉

**结构**：三层叠加

- 主盘（正面）：y = 0
- 上弯光弧：模拟背面光线被弯曲到上方
- 下弯光弧：模拟背面光线被弯曲到下方

```tsx
function AccretionDisk() {
  const diskRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (diskRef.current) {
      diskRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group>
      {/* 主吸积盘 */}
      <mesh ref={diskRef} rotation-x={Math.PI / 2}>
        <ringGeometry args={[1.5, 8, 128, 1]} />
        <shaderMaterial
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uTime: { value: 0 },
            uInnerColor: { value: new THREE.Color("#fff8e0") },
            uOuterColor: { value: new THREE.Color("#ff4400") },
          }}
          fragmentShader={`
            uniform float uTime;
            uniform vec3 uInnerColor;
            uniform vec3 uOuterColor;
            varying vec2 vUv;
            
            void main() {
              float dist = length(vUv - 0.5) * 2.0;
              vec3 color = mix(uInnerColor, uOuterColor, dist);
              
              // 螺旋纹理
              float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
              float spiral = sin(angle * 8.0 - dist * 10.0 + uTime * 2.0) * 0.3 + 0.7;
              
              // 噪声扰动
              float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
              
              float alpha = (1.0 - dist) * spiral * (0.8 + noise * 0.2);
              gl_FragColor = vec4(color * 1.5, alpha);
            }
          `}
        />
      </mesh>

      {/* 上弯光弧 - 引力透镜效果 */}
      <mesh position-y={0.8} rotation-x={Math.PI / 2 + 0.3}>
        <torusGeometry args={[4, 0.3, 16, 100]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 下弯光弧 */}
      <mesh position-y={-0.8} rotation-x={Math.PI / 2 - 0.3}>
        <torusGeometry args={[4, 0.3, 16, 100]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
```

---

#### 3. 光子环 (PhotonRing)

```tsx
// 多层极亮细环
function PhotonRing() {
  return (
    <group rotation-x={Math.PI / 2}>
      {[1.3, 1.35, 1.4].map((radius, i) => (
        <mesh key={i}>
          <torusGeometry args={[radius, 0.02 - i * 0.005, 16, 100]} />
          <meshBasicMaterial
            color="#ffffff"
            toneMapped={false}
            transparent
            opacity={1 - i * 0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
```

---

#### 4. 粒子流 (ParticleStream)

```tsx
const PARTICLE_COUNT = 3000;

function ParticleStream() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const spd = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 3 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = r * Math.sin(theta);
      spd[i] = 0.5 + Math.random() * 0.5;
    }
    return [pos, spd];
  }, []);

  useFrame((state, delta) => {
    const pos = pointsRef.current!.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const x = pos[idx],
        z = pos[idx + 2];
      const r = Math.sqrt(x * x + z * z);
      const theta = Math.atan2(z, x);

      // 旋转 + 下落
      const newTheta = theta + (speeds[i] / r) * delta;
      const newR = r - 0.02 * delta * speeds[i];

      if (newR < 1.5) {
        // 重生
        const spawnR = 8 + Math.random() * 3;
        const spawnTheta = Math.random() * Math.PI * 2;
        pos[idx] = spawnR * Math.cos(spawnTheta);
        pos[idx + 2] = spawnR * Math.sin(spawnTheta);
      } else {
        pos[idx] = newR * Math.cos(newTheta);
        pos[idx + 2] = newR * Math.sin(newTheta);
      }
    }

    pointsRef.current!.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffaa44"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
```

---

#### 5. 星空背景 (Starfield)

```tsx
function Starfield() {
  const starsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      const r = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={5000}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.3} color="#ffffff" transparent opacity={0.8} />
    </points>
  );
}
```

---

### 三、主场景组装

```tsx
// App.tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Canvas
        camera={{ position: [0, 8, 20], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <color attach="background" args={["#000005"]} />

        {/* 场景组件 */}
        <EventHorizon />
        <AccretionDisk />
        <PhotonRing />
        <ParticleStream />
        <Starfield />

        {/* 控制器 */}
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={40}
          autoRotate
          autoRotateSpeed={0.3}
        />

        {/* 后期处理 */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            intensity={2.5}
            radius={0.8}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.002, 0.002]}
          />
          <Vignette offset={0.3} darkness={0.9} />
        </EffectComposer>
      </Canvas>

      {/* 标题覆盖层 */}
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          width: "100%",
          textAlign: "center",
          color: "white",
          fontFamily: "serif",
          pointerEvents: "none",
        }}>
        <h1
          style={{ fontSize: "3rem", fontWeight: 300, letterSpacing: "0.5em" }}>
          GARGANTUA
        </h1>
        <p style={{ opacity: 0.6, letterSpacing: "0.3em" }}>
          DO NOT GO GENTLE INTO THAT GOOD NIGHT
        </p>
      </div>
    </div>
  );
}
```

---

### 四、配色

```typescript
// 星际穿越风格
const palette = {
  core: "#000000", // 事件视界
  innerGlow: "#ff6644", // 边缘光
  diskInner: "#fff8e0", // 内盘（白热）
  diskOuter: "#ff4400", // 外盘（橙红）
  photonRing: "#ffffff", // 光子环
  particles: "#ffaa44", // 粒子
  background: "#000005", // 深空
};
```

---

### 五、交互

```
🖱️ 拖拽 - 环绕观察
🔘 滚轮 - 缩放 (8-40 距离限制)
🔄 自动旋转 - 缓慢环绕
```
