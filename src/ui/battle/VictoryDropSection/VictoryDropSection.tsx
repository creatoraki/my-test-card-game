import type { CSSProperties } from "react";
import { CHALLENGE_DEFS, type ChallengeRun } from "@/engine";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { TooltipCard } from "@/ui/common/TooltipCard";
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
  bountyBonus: number;
  style?: CSSProperties;
}

function EnergyChip({ tier }: { tier: VictoryDropTier }) {
  const { point, bind } = useHoverTooltip();
  return (
    <div
      className={s.chip}
      data-state="ok"
      tabIndex={0}
      {...bind}
      style={{ "--chip-accent": tier.color } as CSSProperties}
      aria-label={`能量档位 ${tier.name}，基础掉落倍率 ${tier.rewardMultiplier.toFixed(2)}`}
    >
      <span className={s.icon} aria-hidden="true">⚡</span>
      <span className={s.copy}>
        <strong>{tier.name}</strong>
        <small>+{tier.rewardMultiplier.toFixed(2)}</small>
      </span>
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard
            title={`能量档位 · ${tier.name}`}
            desc={`本场探索的能量处于该档，基础掉落倍率 ×${tier.rewardMultiplier.toFixed(2)}`}
            notes={[{ text: `掉落加成 +${tier.rewardMultiplier.toFixed(2)}` }]}
          />
        </HoverTooltip>
      )}
    </div>
  );
}

function ChallengeChip({ run, index }: { run: ChallengeRun; index: number }) {
  const def = CHALLENGE_DEFS[run.id];
  const { point, bind } = useHoverTooltip();
  return (
    <div
      className={s.chip}
      data-state={run.broken ? "broken" : "ok"}
      tabIndex={0}
      {...bind}
      style={{ "--chip-accent": "#d8f329", "--chip-delay": victoryStagger(index + 1) } as CSSProperties}
      aria-label={`${def.title}${run.broken ? "，已打破" : "，已达成"}，掉落加成 ${run.broken ? "0.00" : def.dropBonus.toFixed(2)}`}
    >
      <span className={s.icon} aria-hidden="true">{def.icon}</span>
      <span className={s.copy}>
        <strong>{def.title}</strong>
        <small>{run.broken ? "+0.00" : `+${def.dropBonus.toFixed(2)}`}</small>
      </span>
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard
            icon={def.icon}
            title={def.title}
            desc={def.desc}
            notes={[
              { text: `掉落加成 +${def.dropBonus.toFixed(2)}` },
              ...(run.broken ? [{ text: `已打破 · 未获得 +${def.dropBonus.toFixed(2)}`, tone: "bad" as const }] : []),
            ]}
          />
        </HoverTooltip>
      )}
    </div>
  );
}

function BountyChip({ bonus, index }: { bonus: number; index: number }) {
  const { point, bind } = useHoverTooltip();
  const stacks = Math.round(bonus / 0.3);
  return (
    <div
      className={s.chip}
      data-state="ok"
      tabIndex={0}
      {...bind}
      style={{ "--chip-accent": "#ff9f43", "--chip-delay": victoryStagger(index + 1) } as CSSProperties}
      aria-label={`赏金猎人 ${stacks} 层，掉落加成 +${bonus.toFixed(2)}`}
    >
      <span className={s.icon} aria-hidden="true">🎯</span>
      <span className={s.copy}>
        <strong>赏金猎人</strong>
        <small>+{bonus.toFixed(2)}</small>
      </span>
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard
            title="赏金猎人"
            desc="本场战斗完成击杀获得的赏金猎人层数，会在结算时提高掉率。"
            notes={[{ text: `${stacks} 层 · 掉落加成 +${bonus.toFixed(2)}` }]}
          />
        </HoverTooltip>
      )}
    </div>
  );
}

export function VictoryDropSection({ dropK, tier, challenges, challengeBonus, bountyBonus, style }: Props) {
  return (
    <section
      className={s["drop-section"]}
      style={style}
      aria-label={`掉落系数 ×${dropK.toFixed(2)}，挑战加成 +${challengeBonus.toFixed(2)}，赏金猎人加成 +${bountyBonus.toFixed(2)}`}
    >
      <div className={s["drop-main"]}>
        <span className={s.label}>掉落系数</span>
        <strong className={s.value}>×{dropK.toFixed(2)}</strong>
      </div>
      {(tier || challenges.length > 0 || bountyBonus > 0) && (
        <div className={s["drop-sources"]}>
          {tier && <EnergyChip tier={tier} />}
          {challenges.map((run, index) => <ChallengeChip key={run.id} run={run} index={index} />)}
          {bountyBonus > 0 && <BountyChip bonus={bountyBonus} index={challenges.length + 1} />}
        </div>
      )}
    </section>
  );
}