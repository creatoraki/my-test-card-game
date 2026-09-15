import {
  squadDrawCount,
  squadHandLimit,
  squadManaPerRound,
  squadOpeningDrawCount,
  squadRedrawLimit,
  squadWaitLimit,
} from "@/engine";
import { useState, type CSSProperties } from "react";
import { squadModsOf, type SquadResourceKey } from "@/data";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { TrackIcon } from "../TalentTreeRadial/icons";
import { TalentResourceFrame } from "../TalentArtwork/TalentResourceFrame";
import s from "./SquadResourceBar.module.css";

const RESOURCE_LABELS: Record<SquadResourceKey, string> = {
  openingHand: "初始手牌",
  drawCount: "回合抽牌",
  redraws: "换牌次数",
  waits: "待机次数",
  mana: "每回合费用",
  handLimit: "手牌上限",
};

const RESOURCE_ROWS: Array<{ key: SquadResourceKey; branchId: string }> = [
  { key: "openingHand", branchId: "openingHand" },
  { key: "drawCount", branchId: "draw" },
  { key: "redraws", branchId: "redraw" },
  { key: "waits", branchId: "wait" },
  { key: "mana", branchId: "mana" },
  { key: "handLimit", branchId: "handLimit" },
];

const RESOURCE_COLORS: Record<SquadResourceKey, string> = {
  openingHand: "#a0f0bb", drawCount: "#cb8cff", redraws: "#d5f3f6",
  waits: "#67c9ff", mana: "#ffcb68", handLimit: "#ffdc95",
};

interface SquadResourceBarProps {
  highlightKey: SquadResourceKey | null;
  className?: string;
}

export function SquadResourceBar({ highlightKey, className }: SquadResourceBarProps) {
  const [hoverKey, setHoverKey] = useState<SquadResourceKey | null>(null);
  const squadTalent = useTownStore((state) => state.squadTalent);
  const mods = squadModsOf(squadTalent.badgeId, squadTalent.nodes);

  const values: Record<SquadResourceKey, number> = {
    openingHand: squadOpeningDrawCount(mods),
    drawCount: squadDrawCount(mods),
    redraws: squadRedrawLimit(mods),
    waits: squadWaitLimit(mods),
    mana: squadManaPerRound(mods),
    handLimit: squadHandLimit(mods),
  };

  return (
    <div className={cx(s["srb-wrap"], className)}>
      <TalentResourceFrame />
      <section className={s["srb"]} aria-label="小队属性">
        <div className={s["srb-grid"]}>
          {RESOURCE_ROWS.map(({ key, branchId }) => {
            const branchColor = RESOURCE_COLORS[key];
            return (
            <div className={s["srb-cell-wrap"]} key={key}>
              {hoverKey === key && (
                <span className={s["srb-tip"]} role="status">
                  {RESOURCE_LABELS[key]} · {values[key]}
                </span>
              )}
              <button
                className={cx(
                  s["srb-cell"],
                  (highlightKey === key || hoverKey === key) && s["is-highlight"],
                )}
                type="button"
                aria-label={`${RESOURCE_LABELS[key]} ${values[key]}`}
                onMouseEnter={() => setHoverKey(key)}
                onMouseLeave={() => setHoverKey(null)}
                onFocus={() => setHoverKey(key)}
                onBlur={() => setHoverKey(null)}
                style={{ "--srb-color": branchColor } as CSSProperties}
              >
                <span className={s["srb-icon"]} aria-hidden>
                  <TrackIcon branchId={branchId} resource />
                </span>
                <span className={s["srb-label"]}>{RESOURCE_LABELS[key]}</span>
                <strong className={s["srb-value"]}>{values[key]}</strong>
              </button>
            </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
