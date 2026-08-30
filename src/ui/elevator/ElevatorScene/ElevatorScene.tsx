import { useEffect, useRef } from "react";
import { useRunStore } from "@/store/runStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { playBgm, stopBgm } from "@/ui/audio";
import { ELEVATOR_DESCENT_VIDEO } from "@/ui/art/sceneArt";
import s from "./ElevatorScene.module.css";

export function ElevatorScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const finishDescent = useRunStore((state) => state.finishDescent);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    finishDescent();
  };

  useEffect(() => {
    playBgm("elevator");
    const video = videoRef.current;
    if (!video) {
      finish();
      return () => stopBgm("elevator", { fade: true, rewind: true });
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
    };
  }, [finishDescent]);

  return (
    <StageCanvas viewportClassName={s.viewport} className={s.stage}>
      <video
        ref={videoRef}
        className={s.video}
        src={ELEVATOR_DESCENT_VIDEO}
        muted
        autoPlay
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
    </StageCanvas>
  );
}
