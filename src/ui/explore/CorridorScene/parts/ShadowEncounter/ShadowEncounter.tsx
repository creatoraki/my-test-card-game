import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { finishCorridorEncounter } from "@/store/explore/exploreCorridor";
import { CORRIDOR } from "@/explore/corridor/types";
import { designPointToClient } from "@/ui/app/shared/stage";
import { setTransitionOrigin } from "@/ui/app/shared/transitionOrigin";
import { SHADOW_ENCOUNTER_PROGRAM, SHADOW_FIGURE_GEOMETRY } from "@/ui/art/shadowEncounter";
import { GlslSprite, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { ENCOUNTER_TIMING } from "./encounterTiming";
import s from "./ShadowEncounter.module.css";

const G = SHADOW_FIGURE_GEOMETRY;

/**
 * 遇敌黑影(世界层内, 与地面同一坐标系)。到点后以胸口为圆心切入玻璃碎裂。
 * 圆心按设计坐标推算再换算成窗口坐标, 不量 zoom 画布内元素的 getBoundingClientRect(小窗口下会偏)。
 */
export function ShadowEncounter({ x, top, lean, camera, sceneScale, sceneRef }: {
  /** 黑影的世界 x。 */
  x: number;
  /** 地面线在世界层内的 y。 */
  top: number;
  /** 朝向玩家的一侧。 */
  lean: -1 | 1;
  /** 当前镜头左缘(世界 px)。 */
  camera: number;
  /** 世界层相对场景的缩放(以地面线为锚)。 */
  sceneScale: number;
  sceneRef: RefObject<HTMLElement | null>;
}) {
  const [seed] = useState(Math.random);
  const live = useRef({ x, top, camera, sceneScale });
  live.current = { x, top, camera, sceneScale };
  const uniforms = useMemo<GlslUniforms>(() => ({
    uGround: G.groundInset,
    uStart: ENCOUNTER_TIMING.shadowStartMs / 1000,
    uRise: [ENCOUNTER_TIMING.riseStartMs / 1000, ENCOUNTER_TIMING.riseEndMs / 1000],
    uEyes: ENCOUNTER_TIMING.eyesMs / 1000,
    uLean: lean,
  }), [lean]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const scene = sceneRef.current;
      if (scene) {
        const { x: worldX, top: groundY, camera: cam, sceneScale: k } = live.current;
        const chestY = groundY - G.chestY;
        // 世界层以 (0, floorY) 为锚缩放 ⇒ 场景 px = 锚点 + (世界 px - 锚点) × k。
        const sceneX = (worldX - cam) * k;
        const sceneY = CORRIDOR.floorY + (chestY - CORRIDOR.floorY) * k;
        const origin = designPointToClient(scene, sceneX, sceneY);
        setTransitionOrigin(origin.x, origin.y);
      }
      finishCorridorEncounter();
    }, ENCOUNTER_TIMING.totalMs);
    return () => window.clearTimeout(timer);
  }, [sceneRef]);

  return <div className={s.shadow} style={{ left: x, top }} aria-hidden>
    {/* 画布底边下沉 groundInset，让黑泥落在地面线上。 */}
    <div className={s.art} style={{ bottom: -G.groundInset }}>
      <GlslSprite program={SHADOW_ENCOUNTER_PROGRAM} width={G.width} height={G.height} uniforms={uniforms} seed={seed} />
    </div>
  </div>;
}

/** 演出末段的压暗(世界层内, 垫在黑影与玩家之下)：环境沉下去，只留对峙的两人。 */
export function EncounterDim() {
  return <div className={s.dim} style={{ animationDelay: `${ENCOUNTER_TIMING.dimStartMs}ms` }} aria-hidden />;
}
