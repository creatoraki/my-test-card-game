import {
  squadDrawCount,
  squadHandLimit,
  squadManaPerRound,
  squadOpeningDrawCount,
  squadRedrawLimit,
  squadWaitLimit,
} from "@/engine";
import { useState, type CSSProperties } from "react";
import { getBadge, squadModsOf, type SquadResourceKey } from "@/data";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { TRACK_ICON_SIZE, TrackIcon } from "../TalentTreeRadial/icons";
import { branchHueOf } from "../TalentTreeRadial/talentGeometry";
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

const RESOURCE_ICON_SIZE = Math.round(TRACK_ICON_SIZE * 1.2);

interface SquadResourceBarProps {
  highlightKey: SquadResourceKey | null;
  className?: string;
}

export function SquadResourceBar({ highlightKey, className }: SquadResourceBarProps) {
  const [hoverKey, setHoverKey] = useState<SquadResourceKey | null>(null);
  const squadTalent = useTownStore((state) => state.squadTalent);
  const activeBadge = squadTalent.badgeId ? getBadge(squadTalent.badgeId) : undefined;
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
      <section className={s["srb"]} aria-label="小队属性">
        <div className={s["srb-grid"]}>
          {RESOURCE_ROWS.map(({ key, branchId }) => {
            const branchIndex = activeBadge?.branches.findIndex((branch) => branch.id === branchId) ?? -1;
            const branchColor = branchIndex >= 0 ? branchHueOf(branchIndex).hue : undefined;
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
                style={
                  branchColor
                    ? ({ "--srb-color": branchColor, "--srb-icon-size": `${RESOURCE_ICON_SIZE}px` } as CSSProperties)
                    : ({ "--srb-icon-size": `${RESOURCE_ICON_SIZE}px` } as CSSProperties)
                }
              >
                <span className={s["srb-icon"]} aria-hidden>
                  <TrackIcon branchId={branchId} />
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
