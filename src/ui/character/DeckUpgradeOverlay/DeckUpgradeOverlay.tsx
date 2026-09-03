import type { Rarity } from "@/engine";
import { cx } from "@/ui/common/cx";
import { DeckStackGlyph, ExpShardGlyph, LevelBadge, LockGlyph, MaxGlyph, RarityCrystal } from "@/ui/character/glyphs/deckGlyphs";
import type { DeckUpgradeState } from "./useDeckUpgrade";
import s from "./DeckUpgradeOverlay.module.css";

const RARITIES: { id: Rarity; label: string }[] = [
  { id: "common", label: "普通" },
  { id: "uncommon", label: "罕见" },
  { id: "rare", label: "稀有" },
];

interface Props {
  state: DeckUpgradeState;
  onClose: () => void;
}

function percentage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

export function DeckUpgradeOverlay({ state, onClose }: Props) {
  const {
    view,
    levelMax,
    busy,
    canUpgrade,
    shownExp,
    currentChances,
    nextChances,
    pulseFull,
    badgeLevel,
    badgeTargetLevel,
    showLevelTransition,
    chargeProgress,
    holding,
    chargeReady,
    statusLabel,
    holdBind,
  } = state;
  const showNextChance = view.upgradeCost != null && view.level < levelMax;

  return (
    <>
      <header className={s["upg-head"]}>
        <h2 className={s["upg-title"]}>卡组升级</h2>
        <button className={s["upg-close"]} type="button" disabled={busy} onClick={onClose} aria-label="关闭">
          ×
        </button>
      </header>

        <div className={s["upg-body"]}>
          <div className={s["upg-hero"]}>
            <div className={s["upg-badge-block"]}>
              <div className={s["upg-burst"]} aria-hidden="true">
                <span className={s["upg-ring"]} />
              </div>
              <div className={s["upg-badge-current"]}>
                <LevelBadge level={badgeLevel} levelMax={levelMax} />
              </div>
              {showLevelTransition && (
                <div className={s["upg-badge-target"]} aria-hidden="true">
                  <LevelBadge level={badgeTargetLevel} levelMax={levelMax} />
                </div>
              )}
              {!showLevelTransition && !showNextChance && <span className={s["upg-cap"]}>已达上限</span>}
            </div>

            <div className={s["upg-chips"]}>
              <div className={s["upg-chip"]} aria-label={`卡组 ${view.deckSize} 张，最低 ${view.minDeckSize} 张`}>
                <DeckStackGlyph />
                <strong>
                  {view.deckSize}/{view.minDeckSize}
                </strong>
              </div>
              <div className={s["upg-chip"]} aria-label={`当前经验 ${view.exp}`}>
                <ExpShardGlyph />
                <strong>{view.exp}</strong>
              </div>
              <div className={s["upg-chip"]} aria-label={`升级所需经验 ${view.upgradeCost ?? "MAX"}`}>
                {view.upgradeCost == null ? (
                  <MaxGlyph />
                ) : (
                  <LevelBadge level={Math.min(levelMax, view.level + 1)} levelMax={levelMax} />
                )}
                <strong>{view.upgradeCost ?? "MAX"}</strong>
              </div>
            </div>

          </div>

          <div className={s["upg-exp"]}>
              <div className={s["upg-exp-head"]}>
                <span>EXP</span>
                <strong>
                  {shownExp} / {view.upgradeCost == null ? "MAX" : view.upgradeCost}
                </strong>
              </div>
              <div
                className={s["upg-exp-track"]}
                role="progressbar"
                aria-label="卡组升级经验"
                aria-valuemin={0}
                aria-valuemax={view.upgradeCost ?? 1}
                aria-valuenow={view.upgradeCost == null ? 1 : shownExp}
              >
                <div className={cx(s["upg-exp-fill"], pulseFull && s["is-pulse"])} />
                <div className={s["upg-exp-charge"]} aria-hidden="true" />
                <span className={s["upg-exp-glint"]} aria-hidden="true" />
              </div>
          </div>

          <div className={s["upg-probability"]} aria-label="稀有度抽取概率">
            <div className={s["upg-probability-head"]} aria-hidden="true">
              <span>当前 Lv.{view.level}</span>
              {showNextChance ? <span>下一等级 Lv.{view.level + 1}</span> : <span>MAX</span>}
            </div>
            <div className={s["upg-rarity-grid"]}>
              {RARITIES.map(({ id, label }) => {
                const available = view.hasPool[id];
                const current = currentChances[id];
                const next = nextChances?.[id];
                const delta = next == null ? 0 : next - current;
                const deltaVisible = available && next != null && delta !== 0;
                return (
                  <div
                    className={cx(
                      s["upg-rarity-col"],
                      !available && s["is-empty"],
                      delta !== 0 && available && s["is-changed"],
                      delta > 0 && available && s["is-rising"],
                    )}
                    key={id}
                    aria-label={`${label}：${available ? percentage(current) : "无可用卡池"}`}
                  >
                    {deltaVisible && <span className={s["upg-delta"]}>{`${delta >= 0 ? "+" : ""}${percentage(delta)}`}</span>}
                    <RarityCrystal rarity={id} muted={!available} className={s["rarity-crystal"]} />
                    <div className={s["upg-rarity-values"]}>
                      <strong className={s["upg-rarity-value"]}>{available ? percentage(current) : "—"}</strong>
                      {showNextChance && next != null && available && (
                        <>
                          <span className={s["upg-rarity-arrow"]} aria-hidden="true">→</span>
                          <span className={s["upg-rarity-next"]}>{percentage(next)}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={s["upg-ratio-bars"]}>
              <div className={s["upg-ratio-bar"]} aria-hidden="true">
                {RARITIES.map(({ id }) => (
                  <span
                    className={cx(s["upg-ratio-seg"], !view.hasPool[id] && s["is-empty"])}
                    key={id}
                    style={{ flexBasis: `${currentChances[id]}%` }}
                  />
                ))}
              </div>
              {showNextChance && nextChances && (
                <div className={cx(s["upg-ratio-bar"], s["is-next"])} data-next aria-hidden="true">
                  {RARITIES.map(({ id }) => (
                    <span
                      className={cx(s["upg-ratio-seg"], !view.hasPool[id] && s["is-empty"])}
                      key={id}
                      style={{ flexBasis: `${nextChances[id]}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className={s["upg-foot"]}>
          <span className={s["upg-status"]} aria-label={statusLabel || undefined}>
            {statusLabel === "经验不足" && <LockGlyph />}
            {statusLabel === "已达上限" && <MaxGlyph />}
          </span>
          <button
            className={s["upg-button"]}
            type="button"
            disabled={!canUpgrade || busy}
            aria-label={busy ? "升级中" : holding ? `蓄力 ${Math.round(chargeProgress * 100)}%` : "长按升级"}
            {...holdBind}
          >
            <span className={s["upg-button-charge"]} aria-hidden="true" />
            <span className={s["upg-button-sweep"]} aria-hidden="true" />
            <svg className={s["upg-button-ring"]} viewBox="0 0 160 56" preserveAspectRatio="none" aria-hidden="true">
              <path className={s["upg-button-ring-track"]} d="M10 1h149v43l-9 10H1V10Z" pathLength="1" />
              <path
                className={s["upg-button-ring-fill"]}
                d="M10 1h149v43l-9 10H1V10Z"
                pathLength="1"
                strokeDasharray="1"
                style={{ strokeDashoffset: 1 - chargeProgress }}
              />
            </svg>
            <span className={s["upg-button-label"]}>{busy ? "升级中" : "升级"}</span>
            {holding && <span className={s["upg-button-percent"]}>{Math.round(chargeProgress * 100)}%</span>}
          </button>
        </footer>
    </>
  );
}
