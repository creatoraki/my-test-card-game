// 羁绊悬浮详情：直接展示各档效果与门槛，保留当前档位和未激活提示。

import type { BondDef, BondTier } from "@/data/roster/bonds";
import { ArcanaIcon, getArcanaAccent } from "@/ui/common/icon/ArcanaIcon";
import { BondEffect } from "@/ui/common/bond/BondEffect";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";

export function BondTooltip({
  def,
  count,
  tierIndex,
  next = null,
  extraNote,
}: {
  def: BondDef;
  count: number;
  tierIndex: number;
  next?: BondTier | null;
  /** 追加在提示条里的一句话, 如队员档案的「本队员贡献 N 点」。 */
  extraNote?: string;
}) {
  const inactive = tierIndex < 0;
  const accent = getArcanaAccent(def.id) ?? def.color;
  const notes = [
    ...(extraNote ? [{ text: extraNote }] : []),
    ...(inactive && next ? [{ text: `还差 ${next.count - count} 点` }] : []),
  ];

  return (
    <TooltipCard
      icon={<ArcanaIcon id={def.id} size={96} chrome={false} accent={accent} inactive={inactive} />}
      title={def.name}
      meta={`${count} 点 · ${inactive ? "未激活" : `第 ${tierIndex + 1} 档`}`}
      accent={accent}
      notes={notes.length > 0 ? notes : undefined}
    >
      <BondEffect def={def} tierIndex={tierIndex} />
    </TooltipCard>
  );
}
