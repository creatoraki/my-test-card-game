import { difficultyMapConfig, type MapDef, type MapDifficulty } from "@/data";
import { useBoxSize } from "@/ui/common/frame/HudFrame";
import { SortieFrame } from "@/ui/sortie/SortieFrame";
import { SortieGlyph } from "@/ui/sortie/SortieGlyph";
import type { StepMotion } from "@/ui/sortie/SortieScreen/sortieStepTransition";
import s from "./MapMissionInfo.module.css";

/** 面板设计宽高; 简介较长时高度随内容向上生长(底边固定, 不压难度面板)。 */
const PANEL_WIDTH = 660;
const PANEL_MIN_HEIGHT = 236;

interface Props {
  map: MapDef;
  /** 规模按所选难度取值(普通难度可能减少房间)。 */
  difficulty: MapDifficulty;
  index: number;
  motion: StepMotion;
  lockReason: string | null;
}

export function MapMissionInfo({ map, difficulty, index, motion, lockReason }: Props) {
  const roomCount = difficultyMapConfig(map.id, difficulty).roomCount;
  const { ref, size } = useBoxSize<HTMLElement>();
  return (
    <header ref={ref} className={s.info} data-motion={motion} aria-live="polite">
      <div className={s.surface} />
      <SortieFrame width={PANEL_WIDTH} height={Math.max(PANEL_MIN_HEIGHT, size.height)} />
      <span className={s.serial}>任务<b>{String(index + 1).padStart(2, "0")}</b></span>
      <div className={s.titleRow}>
        <h1 className={s.name}>{map.name}</h1>
        {lockReason && <p className={s.lockReason}><SortieGlyph name="lock" className={s.lockIcon} />{lockReason}</p>}
      </div>
      <p className={s.desc}>{map.desc}</p>
      <div className={s.meta}>
        <span className={s.stars} aria-label={`难度 ${map.difficulty} 星，共 5 星`}>
          {Array.from({ length: 5 }, (_, star) => <svg key={star} viewBox="0 0 28 28" aria-hidden="true">
            <path d="m14 2 3.5 8 8.5 1-6.5 6 1.8 9L14 21.5 6.7 26l1.8-9L2 11l8.5-1Z"
              fill={star < map.difficulty ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" />
          </svg>)}
        </span>
        <span className={s.stat}>规模：<b>{roomCount}间房</b></span>
        <span className={s.stat}><SortieGlyph name="link" className={s.link} />粒子：<b>{map.startingEnergy}</b></span>
      </div>
    </header>
  );
}
