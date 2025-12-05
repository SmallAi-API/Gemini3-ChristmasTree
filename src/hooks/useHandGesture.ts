import { useEffect, useRef, useState, useCallback } from "react";
import { Hands, Results, NormalizedLandmarkList } from "@mediapipe/hands";

// 手势类型
export type GestureType = "none" | "fist" | "pinch" | "open";

// 摄像头朝向类型
export type FacingMode = "user" | "environment";

// 手势状态接口
export interface GestureState {
  gesture: GestureType;
  pinchDistance: number; // 捏合距离 (0-1)
  handPosition: { x: number; y: number } | null; // 手掌中心位置
  isTracking: boolean;
}

// 设备信息接口
interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isIPad: boolean;
}

// Hook 返回接口
export interface UseHandGestureReturn {
  gestureState: GestureState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  error: string | null;
  facingMode: FacingMode;
  toggleCamera: () => void;
  deviceInfo: DeviceInfo;
}

// 检测设备类型
function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent.toLowerCase();

  // 检测 iPad（包括 iPadOS 13+ 伪装成 Mac 的情况）
  const isIPad = /ipad/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // 检测 iOS（iPhone、iPod）
  const isIOS = /iphone|ipod/.test(ua) || isIPad;

  // 检测 Android
  const isAndroid = /android/.test(ua);

  // 判断是否为移动设备
  const isMobile = isIOS || isAndroid ||
    /mobile|tablet|touch/.test(ua) ||
    ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  return { isMobile, isIOS, isAndroid, isIPad };
}

// 计算两点之间的距离
function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// 检测握拳手势
function detectFist(landmarks: NormalizedLandmarkList): boolean {
  // 手指尖端索引: 拇指(4), 食指(8), 中指(12), 无名指(16), 小指(20)
  // 手指根部索引: 拇指(2), 食指(5), 中指(9), 无名指(13), 小指(17)
  const fingerTips = [8, 12, 16, 20];
  const fingerBases = [5, 9, 13, 17];
  const wrist = landmarks[0];

  let closedFingers = 0;

  for (let i = 0; i < fingerTips.length; i++) {
    const tip = landmarks[fingerTips[i]];
    const base = landmarks[fingerBases[i]];

    // 如果指尖到手腕的距离小于指根到手腕的距离，则手指弯曲
    const tipToWrist = calculateDistance(tip, wrist);
    const baseToWrist = calculateDistance(base, wrist);

    if (tipToWrist < baseToWrist * 1.1) {
      closedFingers++;
    }
  }

  // 检查拇指
  const thumbTip = landmarks[4];
  const thumbBase = landmarks[2];
  const indexBase = landmarks[5];
  const thumbToIndex = calculateDistance(thumbTip, indexBase);
  const thumbBaseToIndex = calculateDistance(thumbBase, indexBase);

  if (thumbToIndex < thumbBaseToIndex * 1.2) {
    closedFingers++;
  }

  return closedFingers >= 4;
}

// 检测捏合手势并返回距离
function detectPinch(landmarks: NormalizedLandmarkList): {
  isPinching: boolean;
  distance: number;
} {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const distance = calculateDistance(thumbTip, indexTip);
  const isPinching = distance < 0.08;

  return { isPinching, distance: Math.min(distance * 5, 1) };
}

// 获取手掌中心位置
function getHandCenter(landmarks: NormalizedLandmarkList): {
  x: number;
  y: number;
} {
  const wrist = landmarks[0];
  const middleBase = landmarks[9];

  return {
    x: (wrist.x + middleBase.x) / 2,
    y: (wrist.y + middleBase.y) / 2,
  };
}

export function useHandGesture(): UseHandGestureReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isEnabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo] = useState<DeviceInfo>(() => detectDevice());
  // 移动端默认使用前置摄像头
  const [facingMode, setFacingMode] = useState<FacingMode>(() =>
    detectDevice().isMobile ? "user" : "user"
  );
  const [gestureState, setGestureState] = useState<GestureState>({
    gesture: "none",
    pinchDistance: 1,
    handPosition: null,
    isTracking: false,
  });

  // 上一次握拳状态，用于防止重复触发
  const lastFistRef = useRef(false);

  // 切换前后摄像头
  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // 处理手势检测结果
  const onResults = useCallback((results: Results) => {
    // 绘制到 canvas（用于调试）
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx && videoRef.current) {
        ctx.save();
        ctx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        // 水平翻转画布以匹配镜像视频
        ctx.translate(canvasRef.current.width, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        ctx.restore();

        // 绘制手部关键点
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            // 绘制关键点
            ctx.fillStyle = "#00FF00";
            for (const landmark of landmarks) {
              const x = (1 - landmark.x) * canvasRef.current.width;
              const y = landmark.y * canvasRef.current.height;
              ctx.beginPath();
              ctx.arc(x, y, 3, 0, 2 * Math.PI);
              ctx.fill();
            }

            // 高亮拇指和食指（捏合检测点）
            ctx.fillStyle = "#FF0000";
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            ctx.beginPath();
            ctx.arc(
              (1 - thumbTip.x) * canvasRef.current.width,
              thumbTip.y * canvasRef.current.height,
              6,
              0,
              2 * Math.PI
            );
            ctx.fill();
            ctx.beginPath();
            ctx.arc(
              (1 - indexTip.x) * canvasRef.current.width,
              indexTip.y * canvasRef.current.height,
              6,
              0,
              2 * Math.PI
            );
            ctx.fill();
          }
        }
      }
    }

    // 检测手势
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      const isFist = detectFist(landmarks);
      const { isPinching, distance } = detectPinch(landmarks);
      const handPosition = getHandCenter(landmarks);

      let gesture: GestureType = "open";

      if (isFist && !lastFistRef.current) {
        gesture = "fist";
      } else if (isPinching) {
        gesture = "pinch";
      } else if (isFist) {
        gesture = "fist";
      }

      lastFistRef.current = isFist;

      setGestureState({
        gesture,
        pinchDistance: distance,
        handPosition: {
          x: 1 - handPosition.x, // 镜像翻转 x 坐标
          y: handPosition.y,
        },
        isTracking: true,
      });
    } else {
      setGestureState((prev) => ({
        ...prev,
        gesture: "none",
        handPosition: null,
        isTracking: false,
      }));
      lastFistRef.current = false;
    }
  }, []);

  // 停止摄像头流
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // 获取摄像头约束配置
  const getCameraConstraints = useCallback((): MediaStreamConstraints => {
    const { isIOS, isIPad } = deviceInfo;

    // 基础视频约束
    const videoConstraints: MediaTrackConstraints = {
      facingMode: facingMode,
      width: { ideal: 320 },
      height: { ideal: 240 },
    };

    // iOS/iPadOS 特殊处理
    if (isIOS || isIPad) {
      // iOS Safari 对某些约束敏感，简化配置
      return {
        video: {
          facingMode: facingMode,
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
        audio: false,
      };
    }

    return {
      video: videoConstraints,
      audio: false,
    };
  }, [facingMode, deviceInfo]);

  // 初始化 MediaPipe Hands
  useEffect(() => {
    if (!isEnabled) {
      // 清理
      stopCamera();
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
      setGestureState({
        gesture: "none",
        pinchDistance: 1,
        handPosition: null,
        isTracking: false,
      });
      setError(null);
      return;
    }

    let isActive = true;

    const initHands = async () => {
      try {
        // 先停止现有摄像头（切换摄像头时需要）
        stopCamera();

        // 创建 Hands 实例
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        // 使用原生 getUserMedia 获取摄像头
        const constraints = getCameraConstraints();

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (initialError) {
          // 如果指定 facingMode 失败，尝试不指定
          console.warn("指定摄像头失败，尝试默认摄像头:", initialError);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;

          // iOS Safari 需要 playsinline 属性
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.muted = true;

          // 等待视频元数据加载
          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => {
              video
                .play()
                .then(() => resolve())
                .catch(reject);
            };
            video.onerror = () => reject(new Error("视频加载失败"));
            // 超时处理
            setTimeout(() => reject(new Error("视频加载超时")), 10000);
          });

          if (!isActive) return;

          // 开始帧循环处理
          const processFrame = async () => {
            if (!isActive || !handsRef.current || !videoRef.current) return;

            if (videoRef.current.readyState >= 2) {
              try {
                await handsRef.current.send({ image: videoRef.current });
              } catch (e) {
                console.warn("帧处理失败:", e);
              }
            }

            animationFrameRef.current = requestAnimationFrame(processFrame);
          };

          processFrame();
          setError(null);
        }
      } catch (err) {
        console.error("手势追踪初始化失败:", err);

        // 根据错误类型提供更具体的错误信息
        let errorMessage = "无法访问摄像头";
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            errorMessage = "摄像头权限被拒绝，请在浏览器设置中允许访问";
          } else if (err.name === "NotFoundError") {
            errorMessage = "未检测到摄像头设备";
          } else if (err.name === "NotReadableError") {
            errorMessage = "摄像头被其他应用占用";
          } else if (err.name === "OverconstrainedError") {
            errorMessage = "当前设备不支持指定的摄像头配置";
          } else if (err.message.includes("超时")) {
            errorMessage = "摄像头启动超时，请刷新重试";
          }
        }

        if (isActive) {
          setError(errorMessage);
          setEnabled(false);
        }
      }
    };

    initHands();

    return () => {
      isActive = false;
      stopCamera();
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
  }, [isEnabled, facingMode, onResults, getCameraConstraints, stopCamera]);

  return {
    gestureState,
    videoRef,
    canvasRef,
    isEnabled,
    setEnabled,
    error,
    facingMode,
    toggleCamera,
    deviceInfo,
  };
}
