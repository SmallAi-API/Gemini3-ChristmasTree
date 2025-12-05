# 3D 圣诞树项目生成提示词

## 角色设定

你是一名精通 React 19、TypeScript 和 Three.js/React Three Fiber 的 3D 交互体验工程师。

## 任务目标

实现一个高保真 3D Web 项目：ARIX Signature Interactive Christmas Tree

## 整体气质要求

- 主色系：深紫 + 粉色 + 金色点缀
- 电影感辉光与光晕效果
- 奢华但不俗艳的高级感

## 技术栈

React 19 + TypeScript + three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing + maath（缓动动画）

---

## 一、核心交互与状态设计

### 1. 状态机

- `isTreeShape: boolean` 控制两个状态
- SCATTERED（false）：元素在空间中无序漂浮
- TREE_SHAPE（true）：元素聚合为圣诞树圆锥体
- 使用 `maath` 的 `easing.damp()` 实现平滑过渡
- **关键**：散开比聚合更快（scatter: 0.5s, assemble: 1.0s）

### 2. 双位置系统

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

---

## 二、树体与装饰系统

### 1. 针叶粒子层 (Foliage)

- 3000 个粒子，使用 `THREE.Points` + 自定义 ShaderMaterial
- AdditiveBlending + transparent + depthWrite: false

**顶点着色器要点**：

- 位置混合：`mix(position, treePosition, uMix)`
- 呼吸效果：`pos.y += sin(uTime * 1.5 + pulse) * 0.05`
- 水平漂移：`pos.x += sin(uTime * speed + pos.y) * 0.02`
- 颜色渐变：深紫 `(0.3,0.1,0.3)` → 柔粉 `(0.7,0.5,0.7)` 按高度
- 闪烁：`sin(speed*50 + uTime) > 0.95` 时混入白色

**片段着色器**：圆形点 + 边缘辉光衰减

### 2. 装饰物系统 (Ornaments)

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

---

## 三、视觉与后期特效

### 1. 场景与相机

```tsx
<PerspectiveCamera position={[0, 4, 18]} fov={50} />
<OrbitControls target={[0, 4, 0]} minDistance={10} maxDistance={25} />
<Environment preset="city" background={false} blur={0.8} />
```

### 2. 光照系统（粉紫主题）

```tsx
<spotLight position={[10,20,10]} intensity={2.8} color="#ffb6c1" /> // 主光-柔粉
<pointLight position={[-10,5,-10]} intensity={1.5} color="#da70d6" /> // 填充-兰花紫
<spotLight position={[0,10,-10]} intensity={2.2} color="#e8d4e8" /> // 边缘光
<ambientLight intensity={0.2} color="#4b0082" /> // 环境-深紫
```

### 3. 后期处理

```tsx
<Canvas gl={{ toneMapping: CineonToneMapping, toneMappingExposure: 1.1 }}>
  <EffectComposer multisampling={8}>
    <Bloom luminanceThreshold={0.6} intensity={1.2} radius={0.6} mipmapBlur />
    <Noise opacity={0.04} />
    <Vignette offset={0.1} darkness={0.8} />
  </EffectComposer>
</Canvas>
```

### 4. 辅助元素

- **TreeGlow**：Billboard + 径向渐变 shader，树形态时显示
- **Floor**：圆形(r=14) + 雪花纹理 Canvas，树形态时淡入
- **Background**：1000 粒子分布在 r=40~80 球体，缓慢旋转

---
