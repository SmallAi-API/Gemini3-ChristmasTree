<div align="center">

# 🌌 SmallAi React 3D

**基于 React Three Fiber 的沉浸式 3D 交互体验画廊**

[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.181-black?logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[🚀 在线演示](https://react3d.smallai.asia) · [📖 文档](#生成提示词---圣诞树-christmas-tree) · [🐛 反馈问题](https://github.com/smallai/react-3d/issues)

</div>

---

## ✨ 特性

### 🎄 圣诞树 (Christmas Tree)

| 特性            | 描述                                   |
| --------------- | -------------------------------------- |
| 🎯 粒子聚散动画 | 3000+ 粒子在圣诞树与散落状态间平滑切换 |
| 🌟 后期处理特效 | Bloom 辉光、Noise 噪点、Vignette 暗角  |
| 🎵 背景音乐     | 自动播放 + 手动控制，浏览器策略兼容    |
| ❄️ 飘落雪花     | 自定义 GLSL 着色器实现                 |
| 🖱️ 交互控制     | 鼠标拖拽旋转、滚轮缩放                 |

### 🕳️ 黑洞 (Gargantua)

| 特性          | 描述                                             |
| ------------- | ------------------------------------------------ |
| 🔥 吸积盘光环 | 橙红色旋转光盘 + 引力透镜弯曲效果                |
| 💫 光子环     | 多层极亮白色细环，toneMapped=false 过曝          |
| 🌀 粒子物质流 | 3000 粒子螺旋下落被吞噬                          |
| ⭐ 扭曲星空   | 5000 星点被引力弯曲的背景星场                    |
| 🎬 电影级后期 | Bloom + 色差 + 暗角随动画阶段动态变化            |
| 🖐️ 手势识别   | MediaPipe 实时检测：握拳/捏合/张开               |
| 🚀 坠入动画   | attraction → acceleration → crossing → emergence |

---

## 🛠️ 技术栈

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
<br>React 19
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=ts" width="48" height="48" alt="TypeScript" />
<br>TypeScript
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=threejs" width="48" height="48" alt="Three.js" />
<br>Three.js
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=vite" width="48" height="48" alt="Vite" />
<br>Vite 7
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br>Tailwind 4
</td>
</tr>
</table>

**核心依赖：**

- **3D 渲染**：Three.js 0.181 + React Three Fiber 9.4 + @react-three/drei 10.7
- **后期处理**：@react-three/postprocessing 3.0 (Bloom, ChromaticAberration, Vignette)
- **动画**：maath 0.10 (easing.damp) + framer-motion
- **手势识别**：MediaPipe Hands
- **3D 嵌入**：Spline (@splinetool/react-spline)

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/smallai/react-3d.git
cd react-3d

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建产物
pnpm preview
```

访问 http://localhost:5173 查看效果

---

## 📁 项目结构

```
src/
├── App.tsx                  # 路由入口 (HashRouter + React.lazy)
├── pages/
│   ├── Home.tsx             # 画廊首页 (Spline 3D 场景)
│   ├── Christmas.tsx        # 圣诞树场景
│   └── BlackHole.tsx        # 黑洞场景 + 手势控制
├── components/
│   ├── ChristmasTree.tsx    # 圣诞树聚合组件
│   ├── Foliage.tsx          # 树叶粒子 (Points + GLSL)
│   ├── Ornaments.tsx        # 装饰物 (InstancedMesh)
│   ├── FloatingSnow.tsx     # 飘落雪花
│   ├── blackhole/           # 黑洞组件 (barrel export)
│   │   ├── EventHorizon     # 事件视界
│   │   ├── AccretionDisk    # 吸积盘
│   │   ├── PhotonRing       # 光子环
│   │   └── ...
│   └── ui/                  # 通用 UI 组件
├── hooks/
│   └── useHandGesture.ts    # MediaPipe 手势识别 Hook
└── lib/
    └── utils.ts             # cn() 工具函数
```

---

## 🎮 交互说明

### 圣诞树场景

| 操作    | 效果     |
| ------- | -------- |
| 🖱️ 拖拽 | 旋转视角 |
| 🔘 滚轮 | 缩放距离 |
| 🔘 按钮 | 聚散切换 |

### 黑洞场景

| 操作         | 效果         |
| ------------ | ------------ |
| 🖱️ 拖拽      | 环绕观察     |
| 🔘 滚轮      | 缩放 (6-50)  |
| 👆 双击      | 坠入黑洞     |
| ✊ 握拳      | 发射引力波   |
| 🤏 捏合      | 控制旋转速度 |
| ✋ 张开 1 秒 | 触发坠入动画 |

---

## 生成提示词 - 圣诞树 (Christmas Tree)

### 角色设定

你是一名精通 React 19、TypeScript 和 Three.js/React Three Fiber 的 3D 交互体验工程师。

### 任务目标

实现一个高保真 3D Web 项目：ARIX Signature Interactive Christmas Tree

### 整体气质要求

- 主色系：深紫 + 粉色 + 金色点缀
- 电影感辉光与光晕效果
- 奢华但不俗艳的高级感

### 技术栈

React 19 + TypeScript 5.9 + Three.js 0.181 + @react-three/fiber 9.4 + @react-three/drei 10.7 + @react-three/postprocessing 3.0 + maath 0.10（缓动动画）

### 一、核心交互与状态设计

#### 1. 状态机

- `isTreeShape: boolean` 控制两个状态
- SCATTERED（false）：元素在空间中无序漂浮
- TREE_SHAPE（true）：元素聚合为圣诞树圆锥体
- 使用 `maath` 的 `easing.damp()` 实现平滑过渡
- **关键**：散开比聚合更快（scatter: 0.5s, assemble: 1.0s）

#### 2. 双位置系统

每个元素初始化时分配两套坐标：

**scatterPosition** - 球形均匀分布：

```
r = 14 * cbrt(random)  // 立方根确保均匀
theta = random * 2π, phi = acos(2*random - 1)
y 偏移 +6 使中心抬高
```

**treePosition** - 圆锥分布：

```
h = 12 * (1 - cbrt(random))  // 高度0-12，底部更密
maxR = 3.8 * (1 - h/12.5)    // 半径随高度递减
8% 粒子强制放底部边缘形成清晰底边
```

**位置插值**：`mix(scatterPosition, treePosition, uMix)`

### 二、树体与装饰系统

#### 1. 针叶粒子层 (Foliage)

- 3000 个粒子，使用 `THREE.Points` + 自定义 ShaderMaterial
- AdditiveBlending + transparent + depthWrite: false

**顶点着色器要点**：

- 位置混合：`mix(position, treePosition, uMix)`
- 呼吸效果：`pos.y += sin(uTime * 1.5 + pulse) * 0.05`
- 水平漂移：`pos.x += sin(uTime * speed + pos.y) * 0.02`
- 颜色渐变：深紫 `(0.3,0.1,0.3)` → 柔粉 `(0.7,0.5,0.7)` 按高度
- 闪烁：`sin(speed*50 + uTime) > 0.95` 时混入白色

**片段着色器**：圆形点 + 边缘辉光衰减

#### 2. 装饰物系统 (Ornaments)

使用 `InstancedMesh` 优化，每帧更新矩阵

| 类型         | 数量 | 几何体                 | 权重 | 特殊分布           |
| ------------ | ---- | ---------------------- | ---- | ------------------ |
| star         | 1    | 5 角星 ExtrudeGeometry | 0.7  | 固定顶部[0,12,0]   |
| bauble       | 1200 | Sphere(0.15)           | 0.6  | 锥面               |
| bauble-small | 800  | Sphere(0.08)           | 0.8  | 锥面               |
| diamond      | 50   | Octahedron(0.2)        | 0.5  | 中层 h=3~9         |
| gift         | 30   | Box(0.3)               | 0.3  | 底部堆叠 r=1.5~4.5 |
| light        | 400  | Sphere(0.08)           | 0.9  | 锥面               |

**权重系统**：影响散落态漂浮幅度

```
wave = sin(time*0.5 + i) * weight * (1-mix)
```

**材质配置**：

- 彩球：MeshPhysicalMaterial, metalness=0.9, clearcoat=1.0
- 钻石：transmission=0.2, clearcoat=1.0
- 灯光/星星：emissive + emissiveIntensity=10, toneMapped=false
- 礼物：Canvas 纹理（十字丝带图案）

### 三、视觉与后期特效

#### 1. 场景与相机

```tsx
<PerspectiveCamera position={[0, 4, 18]} fov={50} />
<OrbitControls target={[0, 4, 0]} minDistance={10} maxDistance={25} />
<Environment preset="city" background={false} blur={0.8} />
```

#### 2. 光照系统（粉紫主题）

```tsx
<spotLight position={[10,20,10]} intensity={2.8} color="#ffb6c1" /> // 主光-柔粉
<pointLight position={[-10,5,-10]} intensity={1.5} color="#da70d6" /> // 填充-兰花紫
<spotLight position={[0,10,-10]} intensity={2.2} color="#e8d4e8" /> // 边缘光
<ambientLight intensity={0.2} color="#4b0082" /> // 环境-深紫
```

#### 3. 后期处理

```tsx
<Canvas gl={{ toneMapping: CineonToneMapping, toneMappingExposure: 1.1 }}>
  <EffectComposer multisampling={8}>
    <Bloom luminanceThreshold={0.6} intensity={1.2} radius={0.6} mipmapBlur />
    <Noise opacity={0.04} />
    <Vignette offset={0.1} darkness={0.8} />
  </EffectComposer>
</Canvas>
```

#### 4. 辅助元素

- **TreeGlow**：Billboard + 径向渐变 shader，树形态时显示
- **Floor**：圆形(r=14) + 雪花纹理 Canvas，树形态时淡入
- **Background**：1000 粒子分布在 r=40~80 球体，缓慢旋转

---

## 生成提示词 - 黑洞 (Gargantua)

### 角色设定

你是一名精通 React Three Fiber 和 GLSL 着色器的 3D 可视化工程师。

### 任务目标

实现一个《星际穿越》风格的黑洞展示页面，追求视觉震撼而非物理精确。

### 整体气质要求

- 主色系：深空黑 + 橙红吸积盘 + 白热光子环
- 电影感引力透镜效果
- 宇宙尺度的庄严与敬畏感

### 技术栈

React 19 + TypeScript + Three.js 0.181 + @react-three/fiber 9.4 + @react-three/drei 10.7 + @react-three/postprocessing 3.0 + MediaPipe Hands（手势识别）

### 一、视觉构成

```
场景从外到内：
1. 深空星云背景 (Starfield)
2. 螺旋下落的粒子流 (ParticleStream)
3. 橙红色旋转吸积盘 + 上下弯曲光弧 (AccretionDisk)
4. 极亮白色光子环 (PhotonRing)
5. 中心绝对黑暗的事件视界 (EventHorizon)
6. 引力波涟漪效果 (GravityWave)
```

### 二、核心组件

#### 1. 事件视界 (EventHorizon)

黑色球体 + 菲涅尔边缘光：

```glsl
// 片段着色器核心
float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
vec3 glow = uGlowColor * fresnel * 0.5;
gl_FragColor = vec4(glow, 1.0);  // 核心纯黑，边缘橙红光晕
```

#### 2. 吸积盘 (AccretionDisk) ⭐ 核心视觉

**三层结构**：

- 主盘（y=0）：ringGeometry + 螺旋纹理 shader
- 上弯光弧（y=0.8）：引力透镜效果
- 下弯光弧（y=-0.8）：引力透镜效果

**Shader 要点**：

```glsl
// 螺旋纹理
float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
float spiral = sin(angle * 8.0 - dist * 10.0 + uTime * 2.0) * 0.3 + 0.7;
// 颜色：内白热 → 外橙红
vec3 color = mix(vec3(1.0, 0.97, 0.88), vec3(1.0, 0.27, 0.0), dist);
```

#### 3. 光子环 (PhotonRing)

多层极亮细环，toneMapped=false 确保过曝效果：

```tsx
{
  [1.3, 1.35, 1.4].map((radius, i) => (
    <mesh>
      <torusGeometry args={[radius, 0.02 - i * 0.005, 16, 100]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </mesh>
  ));
}
```

#### 4. 粒子物质流 (ParticleStream)

3000 粒子螺旋下落，被吞噬后重生：

```typescript
// 每帧更新：旋转 + 向心下落
const newTheta = theta + (speed / r) * delta;
const newR = r - 0.02 * delta * speed;
if (newR < 1.5) {
  /* 重生到外圈 */
}
```

#### 5. 引力波 (GravityWave)

触发时从中心向外扩散的涟漪效果，使用多层 ring + 透明度衰减。

### 三、多阶段坠入动画

`AnimationPhase` 类型：`idle` → `attraction` → `acceleration` → `crossing` → `emergence`

**后期处理参数随阶段变化**：

| 阶段         | Bloom 强度 | 色差偏移  | 暗角     |
| ------------ | ---------- | --------- | -------- |
| idle         | 1.5        | 0.001     | 0.85     |
| attraction   | +0.5       | +0.002    | +0.1     |
| acceleration | +3.0       | +0.015    | +0.3     |
| crossing     | 5~7 (脉动) | 0.02~0.03 | 1.2      |
| emergence    | 渐弱回归   | 渐弱回归  | 渐弱回归 |

### 四、手势识别交互

基于 MediaPipe Hands 的三种手势：

| 手势    | 检测方式             | 触发效果     |
| ------- | -------------------- | ------------ |
| ✊ 握拳 | 4 指弯曲 + 拇指内收  | 发射引力波   |
| 🤏 捏合 | 拇指-食指距离 < 0.08 | 控制旋转速度 |
| ✋ 张开 | 持续 1 秒            | 触发坠入动画 |

### 五、配色方案

```typescript
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

### 六、后期处理

```tsx
<EffectComposer multisampling={0}>  {/* 禁用多重采样优化性能 */}
  <Bloom luminanceThreshold={0.1} intensity={1.5~5} radius={0.9} mipmapBlur />
  <ChromaticAberration offset={[0.001~0.02, 0.001~0.02]} />
  <Vignette offset={0.25} darkness={0.85~1.2} />
</EffectComposer>
```

### 七、交互说明

```
🖱️ 拖拽 - 环绕观察
🔘 滚轮 - 缩放 (6-50 距离限制)
🔄 自动旋转 - 缓慢环绕（手势可调速）
👆 双击 - 触发坠入动画
✊ 握拳 - 发射引力波
🤏 捏合 - 控制旋转速度
✋ 张开1秒 - 坠入黑洞
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

---

## 🙏 致谢

- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React 渲染 Three.js
- [Drei](https://github.com/pmndrs/drei) - R3F 实用工具集
- [MediaPipe](https://mediapipe.dev/) - 手势识别
- [Interstellar](https://www.imdb.com/title/tt0816692/) - 黑洞视觉灵感来源

---

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

<div align="center">

**[⬆ 回到顶部](#-smallai-react-3d)**

Made with ❤️ by [SmallAi](https://smallai.asia)

🤖 本项目由 **Claude 4.5 Opus** + **Gemini 3.0 Pro** 通过提示词工程完成开发

</div>
