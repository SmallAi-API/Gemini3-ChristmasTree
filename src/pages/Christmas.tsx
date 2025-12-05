import { useState, useRef, useEffect, Suspense } from "react";
import { Link } from "react-router-dom";
import bgmUrl from "../../music/Christmas.MP3";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import ChristmasTree from "../components/ChristmasTree";
import Background from "../components/Background";

export default function Christmas() {
  const [isTreeShape, setIsTreeShape] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      // 设置初始音量
      audio.volume = 0.4;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log("Auto-play prevented by browser policy:", error);
            // 后备方案：在用户首次交互时播放
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

  return (
    <>
      <audio ref={audioRef} src={bgmUrl} loop />
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: false,
          toneMapping: 3, // CineonToneMapping
          toneMappingExposure: 1.1,
        }}>
        <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={50} />

        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 1.6}
          minDistance={10}
          maxDistance={25}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
          target={[0, 4, 0]}
        />

        {/* 电影级灯光设置 - 粉紫色主题 */}
        {/* 主灯光 (柔和粉色) */}
        <spotLight
          position={[10, 20, 10]}
          angle={0.25}
          penumbra={1}
          intensity={2.8}
          color="#ffb6c1"
          castShadow
          shadow-bias={-0.0001}
        />
        {/* 填充光 (兰花紫) */}
        <pointLight
          position={[-10, 5, -10]}
          intensity={1.5}
          color="#da70d6"
          distance={30}
        />
        {/* 轮廓光 (暖色高光) */}
        <spotLight
          position={[0, 10, -10]}
          angle={0.5}
          intensity={2.2}
          color="#e8d4e8"
        />
        {/* 环境填充光 */}
        <ambientLight intensity={0.2} color="#4b0082" />

        {/* 环境贴图 - 使用本地 HDR 文件 */}
        <Suspense fallback={null}>
          <Environment files="/hdri/potsdamer_platz_1k.hdr" background={false} />
        </Suspense>

        <Background />
        <ChristmasTree isTreeShape={isTreeShape} />

        {/* 后期处理效果 */}
        <EffectComposer multisampling={8}>
          <Bloom
            luminanceThreshold={0.6}
            mipmapBlur
            intensity={1.2}
            radius={0.6}
          />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>
      </Canvas>

      <div className="ui-container">
        {/* 返回按钮 */}
        <Link
          to="/"
          className="back-button">
          <span>←</span>
          <span>Back</span>
        </Link>

        <div className="ui-header">
          <span className="subtitle">Interactive Experience</span>
          <h1>ARIX Signature</h1>
        </div>

        <div className="ui-footer">
          <div className="button-group">
            <button
              className="magic-button"
              onClick={() => setIsTreeShape(!isTreeShape)}>
              {isTreeShape ? "Scatter Elements" : "Assemble Dream"}
            </button>
            <button className="magic-button" onClick={toggleMusic}>
              {isPlaying ? "Pause Music" : "Play Music"}
            </button>
          </div>
          <span className="instruction">Drag to Rotate • Scroll to Zoom</span>
        </div>
      </div>
    </>
  );
}
