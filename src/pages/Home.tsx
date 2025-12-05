import { Link } from "react-router-dom";
import { SplineScene } from "@/components/ui/spline";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";

// 项目风格数据
const projectStyles = [
  {
    id: "christmas",
    title: "Christmas Tree",
    subtitle: "圣诞树粒子动画",
    description:
      "基于 React Three Fiber 的交互式 3D 圣诞树，支持粒子聚散动画与后期处理特效",
    path: "/christmas",
    icon: "🎄",
    tags: ["Three.js", "Particle", "PostProcessing"],
  },
  {
    id: "blackhole",
    title: "Interstellar Black Hole",
    subtitle: "星际穿越黑洞",
    description:
      "《星际穿越》风格的黑洞可视化，包含吸积盘、光子环、引力透镜效果与粒子物质流",
    path: "/blackhole",
    icon: "🕳️",
    tags: ["Three.js", "Shader", "PostProcessing"],
  },
  {
    id: "coming-soon",
    title: "Coming Soon",
    subtitle: "敬请期待",
    description: "更多精彩 3D 交互体验即将推出",
    path: "#",
    icon: "✨",
    tags: ["即将推出"],
    disabled: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black overflow-y-auto">
      {/* 主容器 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center gap-8 sm:gap-12">
        {/* Hero 区域 - Spline 3D 场景 */}
        <Card className="w-full h-[300px] sm:h-[400px] md:h-[500px] bg-black/96 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="white"
          />

          <div className="flex h-full">
            {/* 左侧内容 */}
            <div className="flex-1 p-6 sm:p-8 md:p-12 relative z-10 flex flex-col justify-center">
              <span className="text-xs sm:text-sm tracking-[0.3em] sm:tracking-[0.5em] uppercase text-neutral-500 mb-2 sm:mb-4">
                3D Interactive Gallery
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-400">
                ARIX Studio
              </h1>
              <p className="mt-3 sm:mt-4 text-neutral-400 max-w-md text-sm sm:text-base md:text-lg">
                探索精美的 3D 可视化与交互体验。使用 React Three Fiber
                打造沉浸式的视觉效果。
              </p>
            </div>

            {/* 右侧 3D 场景 */}
            <div className="flex-1 relative hidden md:block">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </Card>

        {/* 项目展示标题 */}
        <div className="w-full text-center">
          <span className="text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase text-neutral-600">
            Explore Projects
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-200 mt-2">
            精选作品
          </h2>
        </div>

        {/* 项目卡片网格 */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projectStyles.map((project) => (
            <Link
              key={project.id}
              to={project.disabled ? "#" : project.path}
              className={`group relative bg-black/96 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-500 ${
                project.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-white/20 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:-translate-y-1 active:scale-[0.98]"
              }`}>
              {/* 卡片光效 */}
              {!project.disabled && (
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              )}

              {/* 卡片内容 */}
              <div className="relative z-10">
                {/* 图标 */}
                <span className="text-3xl sm:text-4xl mb-3 sm:mb-4 block">
                  {project.icon}
                </span>

                {/* 副标题 */}
                <span className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-neutral-600 mb-1 sm:mb-2 block">
                  {project.subtitle}
                </span>

                {/* 标题 */}
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-200 mb-2 sm:mb-3 group-hover:text-white transition-colors">
                  {project.title}
                </h3>

                {/* 描述 */}
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed mb-3 sm:mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/5 text-neutral-400 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 箭头 */}
                {!project.disabled && (
                  <div className="absolute top-4 sm:top-6 right-4 sm:right-6 text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-1 transition-all">
                    →
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* 页脚 */}
        <footer className="w-full text-center py-6 sm:py-8 border-t border-white/5">
          <span className="mx-2 sm:mx-3 opacity-50">•</span>
          SmallAi © 2025
        </footer>
      </div>
    </div>
  );
}
