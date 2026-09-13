import type { MapDef } from "@/data";
import { SortieFrame } from "@/ui/sortie/SortieFrame";
import { SortieGlyph } from "@/ui/sortie/SortieGlyph";
import s from "./MapMissionInfo.module.css";

interface Props {
  map: MapDef;
  index: number;
  intro: boolean;
  entering: boolean;
  exiting: boolean;
  lockReason: string | null;
}

export function MapMissionInfo({ map, index, intro, entering, exiting, lockReason }: Props) {
  return (
    <header className={s.info} data-intro={intro || undefined} data-entering={entering || undefined}
      data-exiting={exiting || undefined} aria-live="polite">
      <div className={s.surface} />
      <SortieFrame width={660} height={236} />
      <span className={s.serial}>任务<b>{String(index + 1).padStart(2, "0")}</b></span>
      <h1 className={s.name}>{map.name}</h1>
      <p className={s.desc}>{map.desc}</p>
      <div className={s.meta}>
        <span className={s.stars} aria-label={`难度 ${map.difficulty} 星，共 5 星`}>
          {Array.from({ length: 5 }, (_, star) => <svg key={star} viewBox="0 0 28 28" aria-hidden="true">
            <path d="m14 2 3.5 8 8.5 1-6.5 6 1.8 9L14 21.5 6.7 26l1.8-9L2 11l8.5-1Z"
              fill={star < map.difficulty ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" />
          </svg>)}
        </span>
        <span className={s.stat}>消耗：<b>{map.roundCount}轮</b></span>
        <span className={s.stat}><SortieGlyph name="link" className={s.link} />粒子：<b>{map.startingEnergy}</b></span>
      </div>
      {lockReason && <p className={s.lockReason}><SortieGlyph name="lock" className={s.lockIcon} />{lockReason}</p>}
    </header>
  );
}
