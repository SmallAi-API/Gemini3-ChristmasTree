import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CameraFallControllerProps {
  trigger: number; // 触发时间戳
  onComplete?: () => void;
  onProgress?: (progress: number, phase: AnimationPhase) => void; // 进度回调，用于联动后期处理
}

// 动画阶段
export type AnimationPhase =
  | "attraction" // 被吸引阶段
  | "acceleration" // 加速坠入阶段
  | "crossing" // 穿越视界阶段
  | "emergence" // 涌出/恢复阶段
  | "idle";

// 缓动函数集合
const easings = {
  // 指数级加速 - 模拟引力加速
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  // 指数级减速
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  // 缓入缓出
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  // 缓出
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  // 弹性
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// 相机坠入黑洞动画控制器 - 优化版
export function CameraFallController({
  trigger,
  onComplete,
  onProgress,
}: CameraFallControllerProps) {
  const { camera } = useThree();

  const lastTriggerRef = useRef(0);
  const activeRef = useRef(false);
  const startTimeRef = useRef(0);
  const startPositionRef = useRef(new THREE.Vector3());
  const startQuaternionRef = useRef(new THREE.Quaternion());
  const phaseRef = useRef<AnimationPhase>("idle");

  // 抖动累积器
  const shakeOffsetRef = useRef(new THREE.Vector3());

  // 目标位置 - 黑洞中心
  const targetPosition = new THREE.Vector3(0, 0, 0);

  // 优化后的时间配置 - 总共 7 秒
  const ATTRACTION_DURATION = 2; // 被吸引阶段 - 建立紧张感
  const ACCELERATION_DURATION = 3; // 加速坠入 - 核心体验
  const CROSSING_DURATION = 3; // 穿越视界 - 高潮
  const EMERGENCE_DURATION = 2.0; // 涌出恢复 - 回归
  const TOTAL_DURATION =
    ATTRACTION_DURATION +
    ACCELERATION_DURATION +
    CROSSING_DURATION +
    EMERGENCE_DURATION;

  useEffect(() => {
    if (trigger !== lastTriggerRef.current && trigger > 0) {
      lastTriggerRef.current = trigger;

      // 保存初始状态
      startPositionRef.current.copy(camera.position);
      startQuaternionRef.current.copy(camera.quaternion);

      activeRef.current = true;
      phaseRef.current = "attraction";
      startTimeRef.current = -1;
      shakeOffsetRef.current.set(0, 0, 0);
    }
  }, [trigger, camera]);

  useFrame((state) => {
    if (!activeRef.current) return;

    const time = state.clock.elapsedTime;

    // 初始化开始时间
    if (startTimeRef.current < 0) {
      startTimeRef.current = time;
    }

    const elapsed = time - startTimeRef.current;

    // 确定当前阶段
    let currentPhase: AnimationPhase = "idle";
    if (elapsed < ATTRACTION_DURATION) {
      currentPhase = "attraction";
    } else if (elapsed < ATTRACTION_DURATION + ACCELERATION_DURATION) {
      currentPhase = "acceleration";
    } else if (
      elapsed <
      ATTRACTION_DURATION + ACCELERATION_DURATION + CROSSING_DURATION
    ) {
      currentPhase = "crossing";
    } else if (elapsed < TOTAL_DURATION) {
      currentPhase = "emergence";
    }

    phaseRef.current = currentPhase;

    // 计算总体进度
    const totalProgress = Math.min(elapsed / TOTAL_DURATION, 1);
    onProgress?.(totalProgress, currentPhase);

    // 动画完成
    if (elapsed >= TOTAL_DURATION) {
      activeRef.current = false;
      phaseRef.current = "idle";

      // 重置相机到初始位置
      camera.position.copy(startPositionRef.current);
      camera.quaternion.copy(startQuaternionRef.current);
      (camera as THREE.PerspectiveCamera).fov = 50;
      camera.updateProjectionMatrix();

      onComplete?.();
      return;
    }

    // 相机抖动函数 - 强度随进度变化
    const applyShake = (intensity: number) => {
      const shakeFreq = 30;
      const t = elapsed * shakeFreq;
      shakeOffsetRef.current.set(
        (Math.sin(t * 1.1) * 0.5 + Math.sin(t * 2.3) * 0.3) * intensity,
        (Math.cos(t * 1.3) * 0.5 + Math.cos(t * 2.1) * 0.3) * intensity,
        (Math.sin(t * 0.9) * 0.3 + Math.cos(t * 1.7) * 0.2) * intensity
      );
    };

    // ===== 阶段 1: 被吸引阶段 =====
    if (currentPhase === "attraction") {
      const phaseProgress = elapsed / ATTRACTION_DURATION;
      const easedProgress = easings.easeInOutQuart(phaseProgress);

      // 缓慢向黑洞靠近，让用户看清全貌
      const approachDistance = easedProgress * 0.15; // 只移动 15% 的距离
      const currentPos = new THREE.Vector3().lerpVectors(
        startPositionRef.current,
        targetPosition,
        approachDistance
      );

      // 轻微的向下倾斜，营造被拉扯感
      currentPos.y -= easedProgress * 2;

      camera.position.copy(currentPos);
      camera.lookAt(targetPosition);

      // 轻微抖动开始
      applyShake(phaseProgress * 0.05);
      camera.position.add(shakeOffsetRef.current);

      // FOV 轻微收窄，聚焦效果
      const fov = 50 - easedProgress * 5;
      (camera as THREE.PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
    }

    // ===== 阶段 2: 加速坠入阶段 =====
    else if (currentPhase === "acceleration") {
      const phaseElapsed = elapsed - ATTRACTION_DURATION;
      const phaseProgress = phaseElapsed / ACCELERATION_DURATION;

      // 使用指数加速曲线 - 模拟真实引力加速
      const gravityProgress = easings.easeInExpo(phaseProgress);

      // 起始位置（吸引阶段结束时的位置）
      const attractionEndPos = new THREE.Vector3().lerpVectors(
        startPositionRef.current,
        targetPosition,
        0.15
      );
      attractionEndPos.y -= 2;

      // 当前位置 - 指数级接近中心
      const currentPos = new THREE.Vector3().lerpVectors(
        attractionEndPos,
        targetPosition,
        gravityProgress * 0.95 // 留 5% 距离给穿越阶段
      );

      // 螺旋运动 - 角速度随接近程度指数增加
      const spiralIntensity = Math.pow(phaseProgress, 1.5);
      const spiralSpeed = 1 + spiralIntensity * 8; // 越近旋转越快
      const spiralAngle = phaseElapsed * spiralSpeed;
      const spiralRadius =
        (1 - gravityProgress) * 4 * (1 - phaseProgress * 0.5);

      currentPos.x += Math.cos(spiralAngle) * spiralRadius;
      currentPos.z += Math.sin(spiralAngle) * spiralRadius;
      currentPos.y += Math.sin(spiralAngle * 0.5) * spiralRadius * 0.3;

      camera.position.copy(currentPos);
      camera.lookAt(targetPosition);

      // 相机滚转 - 随螺旋运动
      const rollAngle =
        Math.sin(spiralAngle * 0.8) * 0.4 * (1 - phaseProgress * 0.3);
      camera.rotation.z = rollAngle;

      // 强烈的抖动 - 随接近程度增强
      const shakeIntensity = 0.05 + gravityProgress * 0.3;
      applyShake(shakeIntensity);
      camera.position.add(shakeOffsetRef.current);

      // FOV 急剧扩大 - 营造速度感和扭曲感
      const baseFov = 45; // 吸引阶段结束时的 FOV
      const peakFov = 140;
      const fovProgress = Math.pow(phaseProgress, 1.8); // 后期 FOV 变化更剧烈
      const fov = baseFov + (peakFov - baseFov) * fovProgress;
      (camera as THREE.PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
    }

    // ===== 阶段 3: 穿越视界阶段 =====
    else if (currentPhase === "crossing") {
      const phaseElapsed =
        elapsed - ATTRACTION_DURATION - ACCELERATION_DURATION;
      const phaseProgress = phaseElapsed / CROSSING_DURATION;

      // 在中心点附近剧烈震动
      const chaosIntensity = Math.sin(phaseProgress * Math.PI); // 先增后减

      // 位置在中心点附近随机震动
      const chaosPos = new THREE.Vector3(
        Math.sin(elapsed * 50) * 0.3 * chaosIntensity,
        Math.cos(elapsed * 47) * 0.3 * chaosIntensity,
        Math.sin(elapsed * 53) * 0.3 * chaosIntensity
      );
      camera.position.copy(chaosPos);

      // 相机疯狂旋转
      const spinSpeed = 20;
      camera.rotation.z = elapsed * spinSpeed * chaosIntensity;
      camera.rotation.x = Math.sin(elapsed * 15) * 0.5 * chaosIntensity;

      // 看向随机方向
      const lookTarget = new THREE.Vector3(
        Math.sin(elapsed * 23) * 2,
        Math.cos(elapsed * 19) * 2,
        Math.sin(elapsed * 17) * 2
      );
      camera.lookAt(lookTarget);

      // 极端的抖动
      applyShake(chaosIntensity * 0.5);
      camera.position.add(shakeOffsetRef.current);

      // FOV 达到极限后开始回落
      const peakFov = 160;
      const fovPulse = Math.sin(phaseProgress * Math.PI);
      const fov = 140 + fovPulse * (peakFov - 140);
      (camera as THREE.PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
    }

    // ===== 阶段 4: 涌出/恢复阶段 =====
    else if (currentPhase === "emergence") {
      const phaseElapsed =
        elapsed -
        ATTRACTION_DURATION -
        ACCELERATION_DURATION -
        CROSSING_DURATION;
      const phaseProgress = phaseElapsed / EMERGENCE_DURATION;

      // 使用弹性缓动，有种"弹出"的感觉
      const bounceProgress = easings.easeOutElastic(
        Math.min(phaseProgress * 1.2, 1)
      );
      const smoothProgress = easings.easeOutQuart(phaseProgress);

      // 从中心向外涌出到原始位置
      const emergencePos = new THREE.Vector3().lerpVectors(
        targetPosition,
        startPositionRef.current,
        smoothProgress
      );

      // 轻微的螺旋出来效果（方向相反，强度递减）
      const spiralFade = 1 - smoothProgress;
      const spiralAngle = (1 - phaseProgress) * Math.PI * 2;
      const spiralRadius = spiralFade * 2;

      emergencePos.x += Math.cos(spiralAngle) * spiralRadius * spiralFade;
      emergencePos.z += Math.sin(spiralAngle) * spiralRadius * spiralFade;

      camera.position.copy(emergencePos);

      // 平滑过渡到原始朝向
      const currentQuat = new THREE.Quaternion();
      const lookAtQuat = new THREE.Quaternion();

      // 计算看向黑洞的四元数
      const tempCamera = camera.clone();
      tempCamera.lookAt(targetPosition);
      lookAtQuat.copy(tempCamera.quaternion);

      // 在看向黑洞和原始朝向之间插值
      currentQuat.slerpQuaternions(
        lookAtQuat,
        startQuaternionRef.current,
        smoothProgress
      );
      camera.quaternion.copy(currentQuat);

      // 相机滚转逐渐稳定
      const rollDecay = (1 - smoothProgress) * Math.sin(phaseElapsed * 3) * 0.2;
      camera.rotation.z += rollDecay;

      // 抖动逐渐减弱
      const shakeFade = (1 - smoothProgress) * 0.15;
      applyShake(shakeFade);
      camera.position.add(shakeOffsetRef.current);

      // FOV 弹性恢复到正常
      const targetFov = 50;
      const currentFov = 140 - bounceProgress * (140 - targetFov);
      (camera as THREE.PerspectiveCamera).fov = Math.max(
        currentFov,
        targetFov - 5
      );
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
