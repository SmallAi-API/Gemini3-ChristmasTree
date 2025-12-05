# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ARIX Christmas Tree - 一个基于 React Three Fiber 的交互式 3D 圣诞树可视化项目。支持粒子聚散动画、后期处理特效和背景音乐。

## 常用命令

```bash
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器 (Vite)
pnpm build      # TypeScript 编译 + Vite 构建
pnpm lint       # ESLint 检查
pnpm preview    # 预览构建产物
```

## 技术栈

- **框架**: React 18 + TypeScript
- **3D 渲染**: Three.js + React Three Fiber (@react-three/fiber)
- **3D 工具库**: @react-three/drei (相机控制、环境贴图等)
- **后期处理**: @react-three/postprocessing (Bloom, Noise, Vignette)
- **动画缓动**: maath (easing.damp)
- **构建工具**: Vite

## 架构概览

```
src/
├── App.tsx              # 主入口：Canvas 配置、灯光、相机、后期处理、UI 层
├── main.tsx             # React 挂载点
└── components/
    ├── ChristmasTree.tsx  # 圣诞树组合组件，聚合所有子元素
    ├── Foliage.tsx        # 树叶粒子系统 (Points + 自定义 GLSL Shader)
    ├── Ornaments.tsx      # 装饰物 (InstancedMesh: 彩球、星星、礼物、灯光、钻石)
    ├── Floor.tsx          # 雪花图案地板 (Canvas 程序化纹理)
    ├── FloatingSnow.tsx   # 飘落雪花效果 (Points + 自定义 Shader)
    └── Background.tsx     # 背景星尘粒子
```

## 核心模式

### 1. 聚散动画状态

整个场景的核心状态是 `isTreeShape: boolean`：
- `true`: 粒子聚合成圣诞树形态
- `false`: 粒子散开成随机分布

所有组件通过 `maath.easing.damp()` 实现平滑过渡，散开比聚合更快（0.5s vs 0.9s）。

### 2. 粒子数据结构

每个粒子组件预计算两套位置：
- `scatterData`: 随机球形分布位置
- `treeData`: 圣诞树锥形分布位置

运行时通过 `useFrame` 在两者之间插值。

### 3. 自定义 Shader

- **Foliage/FloatingSnow**: 使用 `shaderMaterial` 配合自定义 GLSL，支持 uniform 动画
- 通过 `bufferAttribute` 传递 per-particle 属性 (size, speed, pulse 等)

### 4. InstancedMesh 优化

`Ornaments.tsx` 使用 InstancedMesh 批量渲染数千个装饰物，每帧更新 `instanceMatrix`。

## 注意事项

- Three.js 版本锁定为 `0.169.0`，@types/three 需匹配
- 音频自动播放受浏览器策略限制，已添加用户交互回退逻辑
- 后期处理使用 8x 多重采样 (`multisampling={8}`)
