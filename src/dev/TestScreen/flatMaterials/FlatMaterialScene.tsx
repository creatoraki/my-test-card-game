import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CORRIDOR, corridorWidthFor } from "@/explore/corridor/types";
import { CorridorAbyss, CorridorFar, CorridorNear } from "@/ui/explore/CorridorScene/parts/CorridorBackdrop";
import { CorridorPlayer } from "@/ui/explore/CorridorScene/parts/CorridorPlayer";
import { applyCorridorFrame } from "@/ui/explore/CorridorScene/corridorFrame";
import { CORRIDOR_LAYOUT, CORRIDOR_SCENE_SCALE } from "@/ui/explore/CorridorScene/corridorLayout";
import scene from "@/ui/explore/CorridorScene/CorridorScene.module.css";
import { FLAT_MATERIALS } from "./materials";
import { GroundedMaterial } from "./GroundedMaterial";
import { MessengerDemo } from "./MessengerDemo";
import { BlacksmithDemo } from "../blacksmith/BlacksmithDemo";
import { usePreviewMovement } from "./usePreviewMovement";
import s from "./FlatMaterialScene.module.css";

const VARIANT = "neonCity1";
const WIDTH = corridorWidthFor(VARIANT);
const FLOOR = CORRIDOR.floorY + CORRIDOR_LAYOUT.entityGroundOffset;

export function FlatMaterialScene() {
  const world = useRef<HTMLDivElement>(null);
  const farStrip = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const onFrame = useCallback((x: number) => {
    applyCorridorFrame({ world: world.current, farStrip: farStrip.current, player: player.current }, x, WIDTH);
  }, []);
  const movement = usePreviewMovement(WIDTH, onFrame);
  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return <div className={s.root}>
    <MessengerDemo />
    <BlacksmithDemo scale={scale} />
    <div className={s.canvas} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
      <div className={scene.scene} aria-label="废弃楼层平面素材测试房间" style={{
        "--corridor-scale": CORRIDOR_SCENE_SCALE,
        "--corridor-floor-y": `${CORRIDOR.floorY}px`,
      } as CSSProperties}>
        <CorridorFar ref={farStrip} mapId="neon-city" />
        <CorridorAbyss variant={VARIANT} />
        <div className={scene.haze} aria-hidden />
        <div className={scene.stage}>
          <div ref={world} className={scene.world} style={{ width: WIDTH }}>
            <CorridorNear width={WIDTH} variant={VARIANT} />
            {FLAT_MATERIALS.map((material) => <GroundedMaterial key={material.name} {...material} floor={FLOOR} />)}
            <div ref={player} className={scene.playerAnchor} style={{ top: FLOOR }}>
              <div className={scene.player}><CorridorPlayer {...movement} /></div>
            </div>
          </div>
        </div>
        <div className={scene.vignette} aria-hidden />
      </div>
    </div>
    <div className={s.instructions}>
      <strong>废弃楼层 · 平面素材预览</strong>
      <span>左右方向键移动 · 向右行走查看全部 {FLAT_MATERIALS.length} 件素材</span>
    </div>
  </div>;
}
