import {
  squadDrawCount,
  squadHandLimit,
  squadManaPerRound,
  squadOpeningDrawCount,
  squadRedrawLimit,
  squadWaitLimit,
} from "@/engine";
import { squadModsOf, type SquadResourceKey } from "@/data";
import { deriveStats, useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { TrackIcon } from "../TalentTreeRadial/icons";
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

interface SquadResourceBarProps {
  highlightKey: SquadResourceKey | null;
  className?: string;
}

export function SquadResourceBar({ highlightKey, className }: SquadResourceBarProps) {
  const party = useTownStore((state) => state.party);
  const characters = useTownStore((state) => state.characters);
  const squadTalent = useTownStore((state) => state.squadTalent);
  const mods = squadModsOf(squadTalent.badgeId, squadTalent.nodes);
  let sumCharHandLimit = 0;
  let sumCharDrawCount = 0;
  for (const charId of party) {
    const character = characters[charId];
    if (!character) continue;
    const stats = deriveStats(character);
    sumCharHandLimit += stats.handLimit;
    sumCharDrawCount += stats.drawCount;
  }

  const values: Record<SquadResourceKey, number> = {
    openingHand: squadOpeningDrawCount(sumCharDrawCount, mods),
    drawCount: squadDrawCount(sumCharDrawCount, mods),
    redraws: squadRedrawLimit(mods),
    waits: squadWaitLimit(mods),
    mana: squadManaPerRound(mods),
    handLimit: squadHandLimit(sumCharHandLimit, mods),
  };

  return (
    <section className={cx(s["srb"], className)} aria-label="小队属性">
      <header className={s["srb-head"]}>
        <span className={s["srb-kicker"]}>SQUAD STATUS</span>
        <h3 className={s["srb-title"]}>小队属性</h3>
      </header>
      <div className={s["srb-grid"]}>
        {RESOURCE_ROWS.map(({ key, branchId }) => (
          <div className={cx(s["srb-row"], highlightKey === key && s["is-highlight"])} key={key}>
            <span className={s["srb-icon"]} aria-hidden>
              <TrackIcon branchId={branchId} />
            </span>
            <span className={s["srb-label"]}>{RESOURCE_LABELS[key]}</span>
            <strong className={s["srb-value"]}>{values[key]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}