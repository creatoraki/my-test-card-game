import { useMemo } from "react";
import { makeCard, newUid, recomputeCardModule } from "@/data";
import type { Card } from "@/engine";
import { DeckCard } from "@/ui/character/DeckCard";
import s from "./DsDeckCardDemo.module.css";

interface CardStateSample {
  card: Card;
  name: string;
  description: string;
  /** 激活态: 该卡此刻有额外收益, 由 DeckCard 透传给 HandCard 的同名属性。 */
  activated?: boolean;
}

function makeModuleCard(contaminated: boolean): Card {
  const card = makeCard("snowflake");
  card.cardModule = { uid: newUid("i"), itemId: "attack-module-t1" };
  card.contaminated = contaminated;
  recomputeCardModule(card);
  return card;
}

function makeCardStateSamples(): CardStateSample[] {
  return [
    {
      card: makeCard("snowflake"),
      name: "普通",
      description: "基础卡面：保留 1 点费用与原始伤害文案，不挂任何装饰层。",
    },
    {
      card: { ...makeCard("snowflake"), contaminated: true },
      name: "污染",
      description: "污染状态：叠加全卡裂纹与右上角污染徽记，卡面整体压暗、变质。",
    },
    {
      card: makeModuleCard(false),
      name: "装模组",
      description: "模组状态：显示模组徽记与模组边框，费用和效果已按模组重算，文案隐藏模组后缀。",
    },
    {
      card: makeModuleCard(true),
      name: "污染 + 模组",
      description: "组合状态：裂纹、污染徽记与模组徽记同时在场，用于检查装饰层是否互相遮挡。",
    },
    {
      card: makeCard("snowflake"),
      name: "激活",
      description:
        "激活状态：该卡此刻有额外收益（培育完成 / 费用降低 / 星辉可抵扣法力水晶），统一表现为整圈边棱通电、卡外呼吸辉光与费用水晶外扩能量环。",
      activated: true,
    },
    {
      card: makeModuleCard(false),
      name: "激活 + 模组",
      description: "组合状态：通电边棱与模组徽记同场，检查右上角徽记是否被辉光冲淡。",
      activated: true,
    },
    {
      card: makeModuleCard(true),
      name: "激活 + 污染",
      description:
        "让位规则：边棱归污染的红族环，激活改由辉光与费用能量环表达，两种信息互不覆盖。",
      activated: true,
    },
  ];
}

export function DsDeckCardDemo() {
  const samples = useMemo(makeCardStateSamples, []);

  return (
    <div className={s.root}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>卡面状态对照</p>
          <h2>雪花 · 七种卡面状态</h2>
        </div>
        <p className={s.intro}>
          同一张剑士卡牌的静态对照：观察普通、污染、装模组、激活，以及它们两两叠加时的卡面层次。
        </p>
      </header>

      <section className={s.cardGrid} aria-label="雪花卡面状态对照表">
        {samples.map((sample, index) => (
          <figure className={s.cardCell} key={sample.card.uid}>
            <DeckCard
              card={sample.card}
              index={index}
              selected={false}
              activated={sample.activated}
              focusStyle="none"
              aria-label={sample.name}
            />
            <figcaption className={s.caption}>
              <strong>{sample.name}</strong>
              <span>{sample.description}</span>
            </figcaption>
          </figure>
        ))}
      </section>
    </div>
  );
}
