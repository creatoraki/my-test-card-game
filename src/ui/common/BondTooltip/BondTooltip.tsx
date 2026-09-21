// 羁绊悬浮详情: 大头部(秘仪图标) + 描述 + 各级效果表 + 未激活时的差额提示。
// 外观统一由 TooltipCard 绘制, 这里只排等级表。

import type { BondDef, BondTier } from "@/data/bonds";
import { ArcanaIcon, getArcanaAccent } from "@/ui/common/ArcanaIcon";
import { cx } from "@/ui/common/cx";
import { TooltipCard } from "@/ui/common/TooltipCard";
import s from "./BondTooltip.module.css";

export function BondTooltip({
  def,
  count,
  tierIndex,
  next = null,
}: {
  def: BondDef;
  count: number;
  tierIndex: number;
  next?: BondTier | null;
}) {
  const inactive = tierIndex < 0;
  const accent = getArcanaAccent(def.id) ?? def.color;

  return (
    <TooltipCard
      icon={<ArcanaIcon id={def.id} size={96} chrome={false} accent={accent} inactive={inactive} />}
      title={def.name}
      meta={`${count} 点 · ${inactive ? "未激活" : `Lv.${tierIndex + 1}`}`}
      desc={def.desc}
      accent={accent}
      notes={inactive && next ? [{ text: `还差 ${next.count - count} 点` }] : undefined}
    >
      <div className={s.tiers}>
        {def.tiers.map((tier, index) => (
          <div className={cx(s.tier, index === tierIndex && s["is-active"])} key={tier.count}>
            <b>Lv.{index + 1} · {tier.count} 点</b>
            <span>{tier.desc}</span>
          </div>
        ))}
      </div>
    </TooltipCard>
  );
}
