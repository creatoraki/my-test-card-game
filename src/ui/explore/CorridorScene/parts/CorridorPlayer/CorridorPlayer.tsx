import { memo } from "react";
import { CORRIDOR_PLAYER_ART_SOURCES } from "@/ui/art/corridor/corridorPlayerArt";
import { CORRIDOR_PLAYER_STAND_FRAME, CORRIDOR_PLAYER_STAND_OFFSET as STAND_OFFSET } from "../../corridorPlayerMotion";
import { useCorridorPlayerAnimation } from "./useCorridorPlayerAnimation";
import s from "./CorridorPlayer.module.css";

export const CorridorPlayer = memo(function CorridorPlayer({ walking, facing }: { walking: boolean; facing: -1 | 1 }) {
  const animation = useCorridorPlayerAnimation(walking, facing);
  const fallbackSource = CORRIDOR_PLAYER_ART_SOURCES[CORRIDOR_PLAYER_STAND_FRAME];
  // 与画布绘制一致：先按校准量平移，再随朝向镜像。
  const fallbackTransform = `scaleX(${facing}) translate(${STAND_OFFSET.x}px, ${STAND_OFFSET.y}px)`;

  return <span className={s.art} aria-hidden="true">
    {!animation.ready && fallbackSource && <span className={s.direction} style={{ transform: fallbackTransform }}>
      <img className={s.image} src={fallbackSource} alt="" draggable={false} />
    </span>}
    <canvas ref={animation.canvasRef} className={s.image} style={{ visibility: animation.ready ? "visible" : "hidden" }} />
  </span>;
});
