# ARIX Christmas Tree

基于 React Three Fiber 的交互式 3D 圣诞树可视化项目。

![Preview](preview.gif)

## 特性

- 粒子聚散动画 - 点击按钮在圣诞树和散落粒子之间切换
- 后期处理特效 - Bloom 辉光、Noise 噪点、Vignette 暗角
- 背景音乐 - 支持自动播放和手动控制
- 飘落雪花 - 自定义 GLSL 着色器实现
- 交互控制 - 鼠标拖拽旋转、滚轮缩放

## 技术栈

- React 18
- TypeScript
- Three.js
- React Three Fiber
- @react-three/drei
- @react-three/postprocessing
- Vite

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 项目结构

```
src/
├── App.tsx              # 主场景：灯光、相机、后期处理
└── components/
    ├── ChristmasTree.tsx  # 圣诞树聚合组件
    ├── Foliage.tsx        # 树叶粒子
    ├── Ornaments.tsx      # 装饰物 (彩球、星星、礼物等)
    ├── Floor.tsx          # 雪花地板
    ├── FloatingSnow.tsx   # 飘落雪花
    └── Background.tsx     # 背景星尘
```

## 许可证

MIT License
