import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CORRIDOR, corridorWidthFor } from "@/explore/corridor/types";
import { CorridorAbyss, CorridorFar, CorridorNear } from "@/ui/explore/CorridorScene/parts/CorridorBackdrop";
import { CorridorPlayer } from "@/ui/explore/CorridorScene/parts/CorridorPlayer";
import { applyCorridorFrame } from "@/ui/explore/CorridorScene/corridorFrame";
import { CORRIDOR_LAYOUT, CORRIDOR_SCENE_SCALE } from "@/ui/explore/CorridorScene/corridorLayout";
import scene from "@/ui/explore/CorridorScene/CorridorScene.module.css";
import { SHOWCASE_PROPS } from "./showcaseProps";
import { ShowcaseProp } from "./ShowcaseProp";
import { PropScalePanel } from "./PropScalePanel";
import { usePreviewMovement } from "./usePreviewMovement";
import s from "./ExplorePropScene.module.css";

const VARIANT = "neonCity1";
const WIDTH = corridorWidthFor(VARIANT);
const FLOOR = CORRIDOR.floorY + CORRIDOR_LAYOUT.entityGroundOffset;

/** 探索场景预览：角色在废弃楼层近景里行走，摆放新画风交互物并用旋钮调缩放。 */
export function ExplorePropScene() {
  const world = useRef<HTMLDivElement>(null);
  const farStrip = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  const onFrame = useCallback((x: number) => {
    applyCorridorFrame({ world: world.current, farStrip: farStrip.current, player: player.current }, x, WIDTH);
  }, []);
  const movement = usePreviewMovement(WIDTH, onFrame);
  const setMultiplier = useCallback((id: string, value: number) => {
    setMultipliers((current) => ({ ...current, [id]: value }));
  }, []);
  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return <div className={s.root}>
    <div className={s.canvas} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
      <div className={scene.scene} aria-label="探索场景交互物预览" style={{
        "--corridor-scale": CORRIDOR_SCENE_SCALE,
        "--corridor-floor-y": `${CORRIDOR.floorY}px`,
      } as CSSProperties}>
        <CorridorFar ref={farStrip} mapId="neon-city" />
        <CorridorAbyss variant={VARIANT} />
        <div className={scene.haze} aria-hidden />
        <div className={scene.stage}>
          <div ref={world} className={scene.world} style={{ width: WIDTH }}>
            <CorridorNear width={WIDTH} variant={VARIANT} />
            {SHOWCASE_PROPS.map((prop) => <ShowcaseProp key={prop.id} prop={prop} multiplier={multipliers[prop.id] ?? 1} floor={FLOOR} />)}
            <div ref={player} className={scene.playerAnchor} style={{ top: FLOOR }}>
              <div className={scene.player}><CorridorPlayer {...movement} /></div>
            </div>
          </div>
        </div>
        <div className={scene.vignette} aria-hidden />
      </div>
    </div>
    <div className={s.instructions}>
      <strong>探索场景 · 交互物预览</strong>
      <span>左右方向键或 A / D 移动角色</span>
    </div>
    <PropScalePanel multipliers={multipliers} onChange={setMultiplier} />
  </div>;
}
