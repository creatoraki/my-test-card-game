import { useEffect, useRef, useState } from "react";
import { isTestMode } from "@/store/dev/devTestStore";
import { useRunStore } from "@/store/run/runStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { playBgm, setBgmSuspended, stopBgm } from "@/ui/audio";
import { ELEVATOR_DESCENT_VIDEO } from "@/ui/art/explore/sceneArt";
import s from "./ElevatorScene.module.css";

export function ElevatorScene() {
  // 测试模式跳过过场: 只在挂载那一刻读一次, 过场中途切开关不影响本次。
  const [isTest] = useState(isTestMode);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const finishRide = useRunStore((state) => state.finishRide);

  const finish = (suspendBgm = true) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (suspendBgm) setBgmSuspended(true);
    finishRide();
  };

  useEffect(() => {
    if (isTest) {
      finish(false);
      return;
    }

    playBgm("elevator");
    const video = videoRef.current;
    if (!video) {
      finish();
      return () => {
        stopBgm("elevator", { fade: true, rewind: true });
        setBgmSuspended(false);
      };
    }

    video.muted = true;
    try {
      void video.play().catch(() => undefined);
    } catch {
      finish();
    }

    return () => {
      video.pause();
      video.currentTime = 0;
      stopBgm("elevator", { fade: true, rewind: true });
      setBgmSuspended(false);
    };
  }, [finishRide]);

  return (
    <StageCanvas viewportClassName={s.viewport} className={s.stage}>
      {!isTest && (
        <video
          ref={videoRef}
          className={s.video}
          src={ELEVATOR_DESCENT_VIDEO}
          muted
          autoPlay
          playsInline
          preload="auto"
          onEnded={() => finish()}
          onError={() => finish()}
        />
      )}
    </StageCanvas>
  );
}
