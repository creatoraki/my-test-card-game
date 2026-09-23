import { memo } from "react";
import { CORRIDOR_PLAYER_ART_SOURCES } from "@/ui/art/corridor/corridorPlayerArt";
import { useCorridorPlayerAnimation } from "./useCorridorPlayerAnimation";
import s from "./CorridorPlayer.module.css";

export const CorridorPlayer = memo(function CorridorPlayer({ walking, facing }: { walking: boolean; facing: -1 | 1 }) {
  const animation = useCorridorPlayerAnimation(walking, facing);
  const fallbackSource = CORRIDOR_PLAYER_ART_SOURCES[0];

  return <span className={s.art} aria-hidden="true">
    {!animation.ready && fallbackSource && <span className={s.direction} style={{ transform: `scaleX(${facing})` }}>
      <img className={s.image} src={fallbackSource} alt="" draggable={false} />
    </span>}
    <canvas ref={animation.canvasRef} className={s.image} style={{ visibility: animation.ready ? "visible" : "hidden" }} />
  </span>;
});
