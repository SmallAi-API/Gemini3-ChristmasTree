import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import {
  EventHorizon,
  AccretionDisk,
  PhotonRing,
  ParticleStream,
  Starfield,
  GravityWave,
  CameraFallController,
  type AnimationPhase,
} from "../components/blackhole";
import { Link } from "react-router-dom";
import bgmUrl from "../../music/Black.MP3";
import { useHandGesture } from "../hooks/useHandGesture";

// 时间模式配置
const TIME_MODES = [
  { label: "慢动作", value: 0.3, icon: "🐢" },
  { label: "正常", value: 1, icon: "▶️" },
  { label: "加速", value: 20, icon: "⚡" },
  { label: "极速", value: 50, icon: "🚀" },
];

// 坠入动画进度状态
interface FallProgress {
  progress: number;
  phase: AnimationPhase;
}

interface BlackHoleSceneProps {
  timeScale: number;
  intensity: number;
  waveTrigger: number;
  fallTrigger: number;
  gestureRotationSpeed: number;
  isFalling: boolean;
  fallProgress: FallProgress;
  onFallComplete: () => void;
  onFallProgress: (progress: number, phase: AnimationPhase) => void;
}

// 黑洞场景组件
function BlackHoleScene({
  timeScale,
  intensity,
  waveTrigger,
  fallTrigger,
  gestureRotationSpeed,
  isFalling,
  fallProgress,
  onFallComplete,
  onFallProgress,
}: BlackHoleSceneProps) {
  // 根据坠入进度计算后期处理参数
  const postProcessingParams = useMemo(() => {
    const { progress, phase } = fallProgress;

    let bloomIntensity = 1.5 + intensity * 0.5;
    let chromaticOffset = 0.001 * intensity;
    let vignetteOffset = 0.25;
    let vignetteDarkness = 0.85;

    if (isFalling) {
      switch (phase) {
        case "attraction":
          bloomIntensity += progress * 0.5;
          chromaticOffset += progress * 0.002;
          vignetteDarkness += progress * 0.1;
          break;
        case "acceleration": {
          const accelProgress = Math.pow(progress, 1.5);
          bloomIntensity += 0.5 + accelProgress * 3;
          chromaticOffset += 0.002 + accelProgress * 0.015;
          vignetteOffset -= accelProgress * 0.15;
          vignetteDarkness += 0.1 + accelProgress * 0.3;
          break;
        }
        case "crossing":
          bloomIntensity = 5 + Math.sin(progress * Math.PI) * 2;
          chromaticOffset = 0.02 + Math.sin(progress * Math.PI * 3) * 0.01;
          vignetteOffset = 0.1;
          vignetteDarkness = 1.2 - progress * 0.3;
          break;
        case "emergence": {
          const emergeProgress = Math.pow(progress, 0.5);
          bloomIntensity = 5 - emergeProgress * 3.5;
          chromaticOffset = 0.02 - emergeProgress * 0.018;
          vignetteOffset = 0.1 + emergeProgress * 0.15;
          vignetteDarkness = 0.9 - emergeProgress * 0.05;
          break;
        }
      }
    }

    return {
      bloomIntensity: Math.max(0.5, bloomIntensity),
      chromaticOffset: Math.max(0, chromaticOffset),
      vignetteOffset: Math.max(0.05, vignetteOffset),
      vignetteDarkness: Math.min(1.5, Math.max(0.5, vignetteDarkness)),
    };
  }, [fallProgress, isFalling, intensity]);

  return (
    <>
      <color attach="background" args={["#000005"]} />

      {/* 场景组件 */}
      <Starfield />
      <ParticleStream timeScale={timeScale} />
      <AccretionDisk timeScale={timeScale} intensity={intensity} />
      <PhotonRing />
      <EventHorizon />
      <GravityWave trigger={waveTrigger} />

      {/* 相机坠入控制器 */}
      <CameraFallController
        trigger={fallTrigger}
        onComplete={onFallComplete}
        onProgress={onFallProgress}
      />

      {/* 环境光 */}
      <ambientLight intensity={0.02} color="#1a1a2e" />

      {/* 控制器 - 坠入时禁用 */}
      <OrbitControls
        enabled={!isFalling}
        enablePan={false}
        minDistance={6}
        maxDistance={50}
        autoRotate={!isFalling}
        autoRotateSpeed={gestureRotationSpeed}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
      />

      {/* 后期处理 - 参数随坠入进度变化 */}
      <EffectComposer enableNormalPass multisampling={0}>
        <Bloom
          luminanceThreshold={0.1}
          intensity={postProcessingParams.bloomIntensity}
          radius={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={
            new THREE.Vector2(
              postProcessingParams.chromaticOffset,
              postProcessingParams.chromaticOffset
            )
          }
        />
        <Vignette
          offset={postProcessingParams.vignetteOffset}
          darkness={postProcessingParams.vignetteDarkness}
        />
      </EffectComposer>
    </>
  );
}

export default function BlackHole() {
  const [timeScale, setTimeScale] = useState(1);
  const [intensity, setIntensity] = useState(1);
  const [waveTrigger, setWaveTrigger] = useState(0);
  const [fallTrigger, setFallTrigger] = useState(0);
  const [isFalling, setIsFalling] = useState(false);
  const [showControls, setShowControls] = useState(false); // 默认隐藏右侧控制
  const [showParams, setShowParams] = useState(false); // 默认隐藏左侧参数
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 坠入动画进度状态
  const [fallProgress, setFallProgress] = useState<FallProgress>({
    progress: 0,
    phase: "idle",
  });

  // 手势追踪
  const {
    gestureState,
    videoRef,
    canvasRef,
    isEnabled: gestureEnabled,
    setEnabled: setGestureEnabled,
    error: gestureError,
    facingMode,
    toggleCamera,
    deviceInfo,
  } = useHandGesture();

  // 上一次握拳状态，防止重复触发
  const lastFistRef = useRef(false);
  // 张开手掌持续时间计时
  const openPalmStartRef = useRef<number | null>(null);

  // 捏合控制旋转速度（相对于 timeScale 的倍率）
  const [gestureSpeedMultiplier, setGestureSpeedMultiplier] = useState(1);
  // 基础旋转速度
  const BASE_ROTATION_SPEED = 0.8;
  // 实际旋转速度 = 基础速度 * timeScale * 手势倍率
  const gestureRotationSpeed =
    BASE_ROTATION_SPEED * timeScale * gestureSpeedMultiplier;

  // 处理手势
  useEffect(() => {
    if (!gestureEnabled || isFalling) return;

    const { gesture, pinchDistance } = gestureState;

    // 握拳触发引力波（改为引力波）
    if (gesture === "fist" && !lastFistRef.current) {
      setWaveTrigger(Date.now());
    }
    lastFistRef.current = gesture === "fist";

    // 张开手掌持续 1 秒触发坠入
    if (gesture === "open") {
      if (openPalmStartRef.current === null) {
        openPalmStartRef.current = Date.now();
      } else {
        const duration = Date.now() - openPalmStartRef.current;
        if (duration >= 1000) {
          // 持续 1 秒
          triggerFall();
          openPalmStartRef.current = null;
        }
      }
    } else {
      openPalmStartRef.current = null;
    }

    // 捏合控制旋转速度倍率
    if (gesture === "pinch") {
      // pinchDistance 从 0（完全捏合）到 1（完全张开）
      // 映射到 -5 到 20 的倍率范围，实现反向旋转到快速旋转
      const multiplier = (1 - pinchDistance) * 25 - 5;
      setGestureSpeedMultiplier(multiplier);
    } else {
      setGestureSpeedMultiplier(1);
    }
  }, [gestureState, gestureEnabled, isFalling]);

  // 音乐播放控制
  const toggleMusic = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // 自动播放音乐
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.3;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log("Auto-play prevented by browser policy:", error);
            const enableAudio = () => {
              if (audio.paused) {
                audio
                  .play()
                  .then(() => setIsPlaying(true))
                  .catch((e) => console.error("Play failed:", e));
              }
              document.removeEventListener("click", enableAudio);
              document.removeEventListener("touchstart", enableAudio);
              document.removeEventListener("keydown", enableAudio);
            };

            document.addEventListener("click", enableAudio);
            document.addEventListener("touchstart", enableAudio);
            document.addEventListener("keydown", enableAudio);
          });
      }
    }
  }, []);

  // 触发引力波
  const triggerWave = useCallback(() => {
    setWaveTrigger(Date.now());
  }, []);

  // 触发坠入动画
  const triggerFall = useCallback(() => {
    if (!isFalling) {
      setIsFalling(true);
      setFallTrigger(Date.now());
      setFallProgress({ progress: 0, phase: "attraction" });
    }
  }, [isFalling]);

  // 坠入完成回调
  const handleFallComplete = useCallback(() => {
    setIsFalling(false);
    setFallProgress({ progress: 0, phase: "idle" });
  }, []);

  // 坠入进度回调
  const handleFallProgress = useCallback(
    (progress: number, phase: AnimationPhase) => {
      setFallProgress({ progress, phase });
    },
    []
  );

  // 双击触发坠入
  const handleDoubleClick = useCallback(() => {
    triggerFall();
  }, [triggerFall]);

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* 背景音乐 */}
      <audio ref={audioRef} src={bgmUrl} loop />

      {/* 手势追踪视频（隐藏） */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* 3D 画布 */}
      <Canvas
        camera={{ position: [0, 8, 20], fov: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        onDoubleClick={handleDoubleClick}>
        <BlackHoleScene
          timeScale={timeScale}
          intensity={intensity}
          waveTrigger={waveTrigger}
          fallTrigger={fallTrigger}
          gestureRotationSpeed={gestureRotationSpeed}
          isFalling={isFalling}
          fallProgress={fallProgress}
          onFallComplete={handleFallComplete}
          onFallProgress={handleFallProgress}
        />
      </Canvas>

      {/* UI 覆盖层 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 返回按钮 */}
        <Link
          to="/"
          className="absolute top-4 sm:top-8 left-4 sm:left-8 pointer-events-auto text-white/50 hover:text-white transition-colors text-xs sm:text-sm tracking-widest uppercase flex items-center gap-1 sm:gap-2">
          <span>←</span>
          <span>Back</span>
        </Link>

        {/* 顶部控制按钮组 */}
        <div className="absolute top-4 sm:top-8 right-4 sm:right-8 pointer-events-auto flex items-center gap-2 sm:gap-4">
          {/* 音乐控制按钮 */}
          <button
            onClick={toggleMusic}
            className="text-white/50 hover:text-white transition-colors text-lg sm:text-xl"
            title={isPlaying ? "暂停音乐" : "播放音乐"}>
            {isPlaying ? "🔊" : "🔇"}
          </button>

          {/* 参数面板切换按钮 */}
          <button
            onClick={() => setShowParams(!showParams)}
            className="text-white/50 hover:text-white transition-colors text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase">
            {showParams ? "隐藏参数" : "参数"}
          </button>

          {/* 控制面板切换按钮 */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="text-white/50 hover:text-white transition-colors text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase">
            {showControls ? "隐藏控制" : "控制"}
          </button>
        </div>

        {/* 控制面板 */}
        {showControls && (
          <div className="absolute top-14 sm:top-20 right-4 sm:right-8 pointer-events-auto flex flex-col gap-3 sm:gap-4 bg-black/80 sm:bg-black/60 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/10 w-48 sm:w-56 max-h-[70vh] overflow-y-auto">
            {/* 时间控制 */}
            <div>
              <label className="text-neutral-500 text-xs tracking-wider uppercase mb-2 block">
                时间流速
              </label>
              <div className="flex gap-1">
                {TIME_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setTimeScale(mode.value)}
                    className={`flex-1 py-2 px-1 rounded text-xs transition-all ${
                      timeScale === mode.value
                        ? "bg-orange-500/30 text-orange-300 border border-orange-500/50"
                        : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10"
                    }`}
                    title={mode.label}>
                    {mode.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* 亮度控制 */}
            <div>
              <label className="text-neutral-500 text-xs tracking-wider uppercase mb-2 block">
                吸积盘强度: {intensity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.3"
                max="2"
                step="0.1"
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* 引力波按钮 */}
            <button
              onClick={triggerWave}
              className="w-full py-3 bg-linear-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/30 transition-all text-sm tracking-wider uppercase">
              发射引力波
            </button>

            {/* 坠入黑洞按钮 */}
            <button
              onClick={triggerFall}
              disabled={isFalling}
              className={`w-full py-3 rounded-lg border transition-all text-sm tracking-wider uppercase ${
                isFalling
                  ? "bg-white/5 text-neutral-600 border-white/5 cursor-not-allowed"
                  : "bg-linear-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/30"
              }`}>
              {isFalling ? "坠入中..." : "坠入黑洞"}
            </button>

            {/* 预设视角 */}
            <div>
              <label className="text-neutral-500 text-xs tracking-wider uppercase mb-2 block">
                快捷设置
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTimeScale(0.2);
                    setIntensity(1.5);
                  }}
                  className="flex-1 py-2 text-xs bg-white/5 text-neutral-400 rounded border border-white/10 hover:bg-white/10 transition-all">
                  电影
                </button>
                <button
                  onClick={() => {
                    setTimeScale(1);
                    setIntensity(1);
                  }}
                  className="flex-1 py-2 text-xs bg-white/5 text-neutral-400 rounded border border-white/10 hover:bg-white/10 transition-all">
                  默认
                </button>
                <button
                  onClick={() => {
                    setTimeScale(50);
                    setIntensity(1.8);
                  }}
                  className="flex-1 py-2 text-xs bg-white/5 text-neutral-400 rounded border border-white/10 hover:bg-white/10 transition-all">
                  疯狂
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GUI 参数面板 */}
        {showParams && (
          <div className="absolute top-14 sm:top-20 left-4 sm:left-8 pointer-events-auto bg-black/80 sm:bg-black/70 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/10 w-52 sm:w-64 max-h-[70vh] overflow-y-auto">
          <h3 className="text-white text-sm font-medium mb-3 tracking-wider uppercase border-b border-white/10 pb-2">
            实时参数
          </h3>

          {/* 手势追踪开关 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-neutral-400 text-xs">手势追踪</span>
            <button
              onClick={() => setGestureEnabled(!gestureEnabled)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                gestureEnabled
                  ? "bg-green-500/30 text-green-300 border border-green-500/50"
                  : "bg-white/5 text-neutral-400 border border-white/10"
              }`}>
              {gestureEnabled ? "开启" : "关闭"}
            </button>
          </div>

          {/* 摄像头切换（仅移动端显示） */}
          {gestureEnabled && deviceInfo.isMobile && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-neutral-400 text-xs">摄像头</span>
              <button
                onClick={toggleCamera}
                className="px-3 py-1 rounded text-xs transition-all bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10">
                {facingMode === "user" ? "前置 📷" : "后置 📷"}
              </button>
            </div>
          )}

          {/* 手势错误提示 */}
          {gestureError && (
            <div className="text-red-400 text-xs mb-3 p-2 bg-red-500/10 rounded border border-red-500/30">
              {gestureError}
            </div>
          )}

          {/* 手势状态 */}
          {gestureEnabled && (
            <div className="space-y-2 mb-3 p-2 bg-white/5 rounded">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">追踪状态</span>
                <span
                  className={
                    gestureState.isTracking
                      ? "text-green-400"
                      : "text-neutral-500"
                  }>
                  {gestureState.isTracking ? "检测到手" : "未检测到"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">当前手势</span>
                <span className="text-cyan-300">
                  {gestureState.gesture === "fist" && "✊ 握拳"}
                  {gestureState.gesture === "pinch" && "🤏 捏合"}
                  {gestureState.gesture === "open" && "✋ 张开"}
                  {gestureState.gesture === "none" && "—"}
                </span>
              </div>
              {gestureState.gesture === "pinch" && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">捏合程度</span>
                  <span className="text-orange-300">
                    {((1 - gestureState.pinchDistance) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {gestureState.gesture === "open" && openPalmStartRef.current && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">坠入倒计时</span>
                  <span className="text-purple-300 animate-pulse">
                    保持张开...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 摄像头预览 */}
          {gestureEnabled && (
            <div className="relative mb-3">
              <canvas
                ref={canvasRef}
                width={160}
                height={120}
                className="w-full rounded border border-white/10"
              />
              <div className="absolute bottom-1 right-1 text-[10px] text-white/50 bg-black/50 px-1 rounded">
                摄像头
              </div>
            </div>
          )}

          {/* 参数显示 */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">时间流速</span>
              <span className="text-white">{timeScale.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">吸积盘强度</span>
              <span className="text-white">{intensity.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">旋转速度</span>
              <span className="text-white">
                {gestureRotationSpeed.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">坠入状态</span>
              <span className={isFalling ? "text-purple-400" : "text-white"}>
                {isFalling ? "坠入中" : "正常"}
              </span>
            </div>
          </div>

          {/* 手势说明 */}
          {gestureEnabled && (
            <div className="mt-3 pt-2 border-t border-white/10">
              <p className="text-neutral-500 text-[10px] leading-relaxed">
                ✊ <span className="text-neutral-400">握拳</span> - 发射引力波
                <br />
                🤏 <span className="text-neutral-400">捏合</span> - 控制旋转速度
                <br />✋ <span className="text-neutral-400">张开 1 秒</span> -
                坠入黑洞
              </p>
            </div>
          )}
        </div>
        )}

        {/* 标题 */}
        <div className="absolute bottom-16 sm:bottom-12 w-full text-center px-4">
          <h1
            className="text-3xl sm:text-5xl md:text-7xl font-light text-white tracking-[0.2em] sm:tracking-[0.5em] mb-2 sm:mb-4"
            style={{
              fontFamily: "serif",
              textShadow: "0 0 60px rgba(255,100,50,0.3)",
            }}>
            GARGANTUA
          </h1>
          <p className="text-neutral-500 tracking-[0.15em] sm:tracking-[0.3em] text-xs sm:text-sm uppercase">
            Do not go gentle into that good night
          </p>
        </div>

        {/* 交互提示 */}
        <div className="absolute bottom-2 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-8 text-neutral-600 text-[10px] sm:text-xs tracking-wider text-center sm:text-right">
          <span className="hidden sm:inline">Drag to Rotate • Scroll to Zoom • Double-click to Fall</span>
          <span className="sm:hidden">拖拽旋转 • 双指缩放 • 双击坠入</span>
          {gestureEnabled && <span className="hidden sm:inline"> • Fist for Wave • Open Palm to Fall</span>}
        </div>
      </div>
    </div>
  );
}
