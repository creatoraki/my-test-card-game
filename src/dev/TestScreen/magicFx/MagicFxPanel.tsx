import type { CSSProperties } from "react";
import { CARD_DEFS } from "@/data";
import { MAGIC_FX_SPECS, type MagicFxSpec } from "./magicFxSpecs";
import s from "./MagicFxShowcase.module.css";

const RATES = [0.25, 0.5, 1] as const;
const COUNTS = [1, 3] as const;
const OWNERS = ["预言家", "咒术师", "植物学家"] as const;
const CARD_NAME = new Map(CARD_DEFS.map((def) => [def.id, def.name]));

export interface MagicFxControls {
  rate: number;
  loop: boolean;
  count: number;
  setRate: (rate: number) => void;
  setLoop: (loop: boolean) => void;
  setCount: (count: number) => void;
  replay: () => void;
}

/** 底部控制面板：按角色分两排的特效选择 + 说明/分配卡牌 + 播放控制。 */
export function MagicFxPanel({ spec, onPick, controls }: { spec: MagicFxSpec; onPick: (id: string) => void; controls: MagicFxControls }) {
  const { rate, loop, count, setRate, setLoop, setCount, replay } = controls;
  return (
    <section className={s.panel}>
      {OWNERS.map((owner) => (
        <div key={owner} className={s.row}>
          <span className={s.rowLabel}>{owner}</span>
          <div className={s.specs}>
            {MAGIC_FX_SPECS.filter((item) => item.owner === owner).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${s.spec} ${item.id === spec.id ? s.specOn : ""}`}
                style={{ "--spec-color": item.color } as CSSProperties}
                onClick={() => onPick(item.id)}
              >
                {item.name}
                {item.mode === "stage" && <span className={s.stageTag}>全屏</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className={s.desc}>
        {spec.desc}
        <span className={s.timing}>爆点 {spec.impactMs} 毫秒 · 全长 {spec.totalMs} 毫秒</span>
      </p>
      <div className={s.cards}>
        <span className={s.controlLabel}>{spec.planned ? "拟分配卡牌" : "分配卡牌"}</span>
        {spec.cards.map((id) => (
          <span key={id} className={s.card} style={{ "--spec-color": spec.color } as CSSProperties}>
            {CARD_NAME.get(id) ?? id}
          </span>
        ))}
      </div>
      <div className={s.controls}>
        <button type="button" className={s.chip} onClick={replay}>重播</button>
        <span className={s.controlLabel}>速度</span>
        {RATES.map((value) => (
          <button key={value} type="button" className={`${s.chip} ${rate === value ? s.chipOn : ""}`} onClick={() => setRate(value)}>
            {value === 1 ? "原速" : `${value} 倍`}
          </button>
        ))}
        {spec.mode === "stage" && (
          <>
            <span className={s.controlLabel}>目标数</span>
            {COUNTS.map((value) => (
              <button key={value} type="button" className={`${s.chip} ${count === value ? s.chipOn : ""}`} onClick={() => setCount(value)}>
                {value} 个
              </button>
            ))}
          </>
        )}
        <button type="button" className={`${s.chip} ${loop ? s.chipOn : ""}`} onClick={() => setLoop(!loop)}>
          {loop ? "循环播放中" : "单次播放"}
        </button>
      </div>
    </section>
  );
}
