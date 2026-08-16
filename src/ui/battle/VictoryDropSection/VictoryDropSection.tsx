import type { CSSProperties } from "react";
import { CHALLENGE_DEFS, type ChallengeRun } from "@/engine";
import { RailPopover } from "@/ui/common/RailPopover";
import { victoryStagger } from "@/ui/battle/victoryChoreo";
import s from "./VictoryDropSection.module.css";

export interface VictoryDropTier {
  tier: number;
  name: string;
  color: string;
  rewardMultiplier: number;
}

interface Props {
  dropK: number;
  tier: VictoryDropTier | null;
  challenges: ChallengeRun[];
  challengeBonus: number;
  style?: CSSProperties;
}

function EnergyChip({ tier }: { tier: VictoryDropTier }) {
  return (
    <div
      className={s.chip}
      data-rail-item
      data-state="ok"
      tabIndex={0}
      style={{ "--chip-accent": tier.color } as CSSProperties}
      aria-label={`能量档位 ${tier.name}，基础掉落倍率 ${tier.rewardMultiplier.toFixed(2)}`}
    >
      <span className={s.icon} aria-hidden="true">⚡</span>
      <span className={s.copy}>
        <strong>{tier.name}</strong>
        <small>+{tier.rewardMultiplier.toFixed(2)}</small>
      </span>
      <RailPopover side="bottom-left">
        <strong>能量档位 · {tier.name}</strong>
        <p>本场探索的能量处于该档，基础掉落倍率 ×{tier.rewardMultiplier.toFixed(2)}</p>
        <small>掉落加成 +{tier.rewardMultiplier.toFixed(2)}</small>
      </RailPopover>
    </div>
  );
}

function ChallengeChip({ run, index }: { run: ChallengeRun; index: number }) {
  const def = CHALLENGE_DEFS[run.id];
  const side = index === 0 ? "bottom-left" : "bottom-right";
  return (
    <div
      className={s.chip}
      data-rail-item
      data-state={run.broken ? "broken" : "ok"}
      tabIndex={0}
      style={{ "--chip-accent": "#d8f329", "--chip-delay": victoryStagger(index + 1) } as CSSProperties}
      aria-label={`${def.title}${run.broken ? "，已打破" : "，已达成"}，掉落加成 ${run.broken ? "0.00" : def.dropBonus.toFixed(2)}`}
    >
      <span className={s.icon} aria-hidden="true">{def.icon}</span>
      <span className={s.copy}>
        <strong>{def.title}</strong>
        <small>{run.broken ? "+0.00" : `+${def.dropBonus.toFixed(2)}`}</small>
      </span>
      <RailPopover side={side}>
        <strong>{def.title}</strong>
        <p>{def.desc}</p>
        <small>掉落加成 +{def.dropBonus.toFixed(2)}</small>
        {run.broken && <em>已打破 · 未获得 +{def.dropBonus.toFixed(2)}</em>}
      </RailPopover>
    </div>
  );
}

export function VictoryDropSection({ dropK, tier, challenges, challengeBonus, style }: Props) {
  return (
    <section
      className={s["drop-section"]}
      style={style}
      aria-label={`掉落系数 ×${dropK.toFixed(2)}，挑战加成 +${challengeBonus.toFixed(2)}`}
    >
      <div className={s["drop-main"]}>
        <span className={s.label}>掉落系数</span>
        <strong className={s.value}>×{dropK.toFixed(2)}</strong>
      </div>
      {(tier || challenges.length > 0) && (
        <div className={s["drop-sources"]}>
          {tier && <EnergyChip tier={tier} />}
          {challenges.map((run, index) => <ChallengeChip key={run.id} run={run} index={index} />)}
        </div>
      )}
    </section>
  );
}