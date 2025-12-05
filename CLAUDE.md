# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ARIX Studio - 基于 React Three Fiber 的 3D 交互体验画廊。包含圣诞树粒子动画和星际穿越风格黑洞可视化两个作品。

## 常用命令

```bash
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器 (Vite)
pnpm build      # TypeScript 编译 + Vite 构建
pnpm lint       # ESLint 检查
pnpm preview    # 预览构建产物
```

## 技术栈

- **框架**: React 19.2 + TypeScript 5.9
- **3D 渲染**: Three.js 0.181.2 + React Three Fiber 9.4
- **3D 工具库**: @react-three/drei 10.7 (相机控制、环境贴图)
- **后期处理**: @react-three/postprocessing 3.0 (Bloom, ChromaticAberration, Vignette)
- **动画**: maath 0.10 (easing.damp) + framer-motion
- **样式**: Tailwind CSS 4 + @tailwindcss/vite
- **手势识别**: MediaPipe Hands
- **3D 嵌入**: Spline (@splinetool/react-spline)
- **路由**: React Router DOM (HashRouter，支持静态部署)
- **构建**: Vite 7

## 路径别名

使用 `@/` 指向 `src/` 目录，在 vite.config.ts 和 tsconfig.json 中配置。

## 架构概览

```
src/
├── App.tsx                    # 路由入口 (HashRouter + React.lazy)
├── pages/                     # 页面组件（懒加载）
│   ├── Home.tsx               # 画廊首页，Spline 3D + 项目卡片
│   ├── Christmas.tsx          # 圣诞树场景
│   └── BlackHole.tsx          # 黑洞场景 + 手势控制
├── components/
│   ├── Christmas*             # 圣诞树相关 (Foliage, Ornaments, Floor, FloatingSnow, Background)
│   ├── blackhole/             # 黑洞组件 (barrel export via index.ts)
│   │   └── index.ts           # 导出 EventHorizon, AccretionDisk, PhotonRing 等
│   └── ui/                    # 通用 UI (card, spotlight, spline)
├── hooks/
│   └── useHandGesture.ts      # MediaPipe 手势识别 Hook
└── lib/
    └── utils.ts               # cn() 工具函数
```

## 核心模式

### 1. 圣诞树：聚散动画状态

核心状态 `isTreeShape: boolean` 控制粒子形态：
- `true`: 聚合成圣诞树锥形
- `false`: 散开成球形分布

使用 `maath.easing.damp()` 平滑过渡，散开速度 > 聚合速度。

### 2. 黑洞：多阶段坠入动画

`AnimationPhase` 类型定义坠入阶段：`idle` → `attraction` → `acceleration` → `crossing` → `emergence`

后期处理参数（Bloom、ChromaticAberration、Vignette）随阶段动态变化。

### 3. 手势识别 (useHandGesture)

基于 MediaPipe Hands，检测三种手势：
- `fist` (握拳): 触发引力波
- `pinch` (捏合): 控制旋转速度
- `open` (张开 1 秒): 触发坠入动画

### 4. 粒子系统渲染优化

- **Points + shaderMaterial**: 用于 Foliage、FloatingSnow 等大量粒子
- **InstancedMesh**: 用于 Ornaments 等需要不同几何体的装饰物
- 所有粒子预计算双位置数据，运行时插值

## 注意事项

- Three.js 版本 `0.181.2`，@types/three 需匹配 `0.181.0`
- 音频自动播放受浏览器策略限制，已添加用户交互回退逻辑
- 黑洞场景禁用多重采样 (`multisampling={0}`) 以优化性能
- 手势识别需要摄像头权限
