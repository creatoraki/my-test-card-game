import { useMemo, type CSSProperties } from "react";
import type { Rarity } from "@/engine";
import { deckRarityChances } from "@/engine";
import { cx } from "@/ui/common/cx";
import { useHoldCharge } from "@/ui/hooks/useHoldCharge";
import { DeckStackGlyph, ExpShardGlyph, LockGlyph, RarityCrystal } from "@/ui/character/glyphs/deckGlyphs";
import { CHARGE_MS } from "./forgeChoreo";
import s from "./ForgeDrawBrief.module.css";

const RARITIES: { id: Rarity; label: string }[] = [
  { id: "common", label: "普通" },
  { id: "uncommon", label: "罕见" },
  { id: "rare", label: "稀有" },
];

function percentage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

interface Props {
  drawCost: number;
  exp: number;
  deckLevel: number;
  deckSize: number;
  minDeckSize: number;
  hasPool: Record<Rarity, boolean>;
  canConfirmDraw: boolean;
  drawDisabledReason?: string;
  charging: boolean;
  leaving?: boolean;
  onStartDraw: () => void;
}

export function ForgeDrawBrief({
  drawCost,
  exp,
  deckLevel,
  deckSize,
  minDeckSize,
  hasPool,
  canConfirmDraw,
  drawDisabledReason,
  charging,
  leaving = false,
  onStartDraw,
}: Props) {
  const chances = useMemo(() => deckRarityChances(deckLevel, hasPool), [deckLevel, hasPool]);
  const { progress, holding, bind } = useHoldCharge({
    ms: CHARGE_MS,
    disabled: !canConfirmDraw || charging,
    onComplete: onStartDraw,
  });
  const chargeReady = holding && progress >= 0.82;
  const statusLabel = drawDisabledReason ?? "";

  return (
    <div
      className={cx(s["brief"], holding && s["is-holding"], chargeReady && s["is-charge-ready"])}
      data-leaving={leaving ? "true" : undefined}
      style={{ "--charge": progress } as CSSProperties}
    >
      <div className={s["brief-intro"]}>
        <span className={s["brief-kicker"]}>DRAW PROTOCOL / 概率预览</span>
        <p className={s["brief-sub"]}>确认后消耗经验，并从以下稀有度中抽取三张候选。</p>
      </div>

      <div className={s["probability"]} aria-label="稀有度抽取概率">
        <div className={s["rarity-grid"]}>
          {RARITIES.map(({ id, label }) => {
            const available = hasPool[id];
            return (
              <div
                className={cx(s["rarity-col"], !available && s["is-empty"])}
                key={id}
                aria-label={`${label}：${available ? percentage(chances[id]) : "无可用卡池"}`}
              >
                <span className={s["rarity-label"]}>{label}</span>
                <RarityCrystal rarity={id} muted={!available} className={s["rarity-crystal"]} />
                <strong>{available ? percentage(chances[id]) : "—"}</strong>
              </div>
            );
          })}
        </div>
        <div className={s["ratio-bar"]} aria-hidden="true">
          {RARITIES.map(({ id }) => (
            <span
              className={cx(s["ratio-seg"], !hasPool[id] && s["is-empty"])}
              key={id}
              style={{ flexBasis: `${chances[id]}%` }}
            />
          ))}
        </div>
      </div>

      <div className={s["chips"]}>
        <div className={s["chip"]} aria-label={`本次消耗经验 ${drawCost}`}>
          <ExpShardGlyph />
          <span>消耗</span>
          <strong className={exp < drawCost ? s["is-insufficient"] : undefined}>{drawCost}</strong>
        </div>
        <div className={s["chip"]} aria-label={`当前经验 ${exp}`}>
          <ExpShardGlyph />
          <span>当前经验</span>
          <strong>{exp}</strong>
        </div>
        <div className={s["chip"]} aria-label={`卡组 ${deckSize} 张，最低 ${minDeckSize} 张`}>
          <DeckStackGlyph />
          <span>卡组</span>
          <strong>
            {deckSize}/{minDeckSize}
          </strong>
        </div>
        <div className={s["chip"]} aria-label={`卡组等级 ${deckLevel}`}>
          <DeckStackGlyph />
          <span>等级</span>
          <strong>Lv.{deckLevel}</strong>
        </div>
      </div>

      <footer className={s["foot"]}>
        <span className={s["status"]} aria-label={statusLabel || undefined}>
          {statusLabel && <LockGlyph />}
          {statusLabel}
        </span>
        <button
          className={s["charge-button"]}
          data-forge-charge
          type="button"
          disabled={!canConfirmDraw || charging}
          aria-label={charging ? "抽卡准备中" : holding ? `蓄力 ${Math.round(progress * 100)}%` : "长按确认抽卡"}
          {...bind}
        >
          <span className={s["charge-fill"]} aria-hidden="true" />
          <span className={s["charge-sweep"]} aria-hidden="true" />
          <svg className={s["charge-ring"]} viewBox="0 0 210 56" preserveAspectRatio="none" aria-hidden="true">
            <path className={s["charge-ring-track"]} d="M10 1h199v43l-9 10H1V10Z" pathLength="1" />
            <path
              className={s["charge-ring-fill"]}
              d="M10 1h199v43l-9 10H1V10Z"
              pathLength="1"
              strokeDasharray="1"
              style={{ strokeDashoffset: 1 - progress }}
            />
          </svg>
          <span className={s["charge-label"]}>{charging ? "准备中" : "长按确认抽卡"}</span>
          {holding && <span className={s["charge-percent"]}>{Math.round(progress * 100)}%</span>}
        </button>
      </footer>
    </div>
  );
}
