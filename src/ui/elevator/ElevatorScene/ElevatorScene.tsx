import { useEffect, useRef } from "react";
import { useRunStore } from "@/store/runStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
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
    const video = videoRef.current;
    if (!video) {
      finish();
      return;
    }

    video.muted = false;
    try {
      void video
        .play()
        .catch(() => {
          video.muted = true;
          return video.play();
        })
        .catch(finish);
    } catch {
      video.muted = true;
      try {
        void video.play().catch(finish);
      } catch {
        finish();
      }
    }
  }, [finishDescent]);

  return (
    <StageCanvas viewportClassName={s.viewport} className={s.stage}>
      <video
        ref={videoRef}
        className={s.video}
        src={ELEVATOR_DESCENT_VIDEO}
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
    </StageCanvas>
  );
}
