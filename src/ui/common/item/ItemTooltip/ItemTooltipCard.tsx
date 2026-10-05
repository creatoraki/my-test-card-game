import { BondEffect } from "@/ui/common/bond/BondEffect";
// 物品悬浮详情卡 —— 直接套全项目统一的 TooltipCard(与 BUFF 详情同款):
// 徽章图标 + 大标题 + 稀有度/分类副信息 → 斜切正文面板(描述 + 属性 / 遗物 / 装配条件 / 羁绊) → 底栏。
// 内容口径与详情栏 ItemDetail 同一份(itemDetailData); 这里只负责换成卡片的排法。

import type { ReactNode } from "react";
import { getBondDef, getCardModule, getItemDef } from "@/data";
import { rollPerfectness } from "@/items/equipRoll";
import {
  CATEGORY_LABEL,
  RARITY_LABEL,
  RELIC_POLARITY_LABEL,
  RELIC_SCOPE_LABEL,
  SLOT_LABEL,
  type ItemStack,
} from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import { BondIcon } from "@/ui/common/bond/BondIcon";
import { itemStatRows, relicTriggerText } from "@/ui/common/item/ItemDetail";
import { cx } from "@/ui/common/shared/cx";
import { TooltipCard, type TooltipNote } from "@/ui/common/tooltip/TooltipCard";
import s from "./ItemTooltipCard.module.css";

export function ItemTooltipCard({
  stack,
  footer,
  className,
}: {
  stack: ItemStack;
  /** 卡片底栏(交互态的操作栏)。 */
  footer?: ReactNode;
  className?: string;
}) {
  const def = getItemDef(stack.itemId);
  // def.affinity = 羁绊饰品的固定羁绊; stack.affinity = 掉落时 roll 出的随机羁绊。
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  const cardModule = def.category === "module" ? getCardModule(def.id) : undefined;
  const rows = itemStatRows(stack, def);
  const perfectness = def.category === "equipment" && stack.roll ? rollPerfectness(def, stack.roll) : null;

  const meta = [
    RARITY_LABEL[def.rarity],
    CATEGORY_LABEL[def.category],
    def.slot ? SLOT_LABEL[def.slot] : null,
    stack.count > 1 ? `×${stack.count}` : null,
  ].filter(Boolean).join(" · ");

  const notes: TooltipNote[] = stack.disposable
    ? [{ text: "一次性物品：远征结束后自动销毁，无法带回仓库，也无法寄回。", tone: "bad" }]
    : [];

  const hasRows = perfectness !== null || rows.length > 0 || Boolean(cardModule);
  const hasExtra = hasRows || Boolean(def.relic) || Boolean(bond) || Boolean(def.affinityRollable);

  return (
    <TooltipCard
      icon={itemIcon(def)}
      title={def.name}
      meta={meta}
      desc={def.desc || undefined}
      accent={`var(--rarity-${def.rarity})`}
      notes={notes}
      footer={footer}
      className={className}
    >
      {hasExtra ? (
        <div className={cx(s.extra, def.desc && s["after-desc"])}>
          {def.relic && (
            <p className={s.relic}>
              <strong>{RELIC_POLARITY_LABEL[def.relic.polarity]}</strong>
              <span>{RELIC_SCOPE_LABEL[def.relic.scope]}</span>
              {def.relic.on && <span>{relicTriggerText(def.relic.on)}触发</span>}
              {def.relic.every && <span>每 {def.relic.every} 次触发结算</span>}
              {def.relic.purifyTo && <span>可在圣水池净化</span>}
            </p>
          )}

          {hasRows && (
            <dl className={s.rows}>
              {perfectness !== null && (
                <div>
                  <dt>完美度</dt>
                  <dd className={s.accent}>{perfectness}</dd>
                </div>
              )}
              {rows.map((row) => (
                <div key={`${row.label}${row.value}`}>
                  <dt>{row.label}</dt>
                  <dd className={row.good ? s.good : s.bad}>{row.value}</dd>
                </div>
              ))}
              {cardModule && (
                <div>
                  <dt>装配条件</dt>
                  <dd className={s.field}>{cardModule.equipText}</dd>
                </div>
              )}
            </dl>
          )}

          {/* 羁绊词条 —— 计数只在**上阵角色**穿戴时才作数, 这里只是「这件东西带什么」。 */}
          {bond && (
            <div className={s.bond}>
              <div className={s["bond-head"]}>
                <BondIcon bondId={bond.id} className={s["bond-icon"]} />
                <span className={s["bond-name"]}>{bond.name}</span>
                <span className={s["bond-arcana"]}>{bond.arcana}</span>
                <span className={s["bond-count"]}>羁绊 +1</span>
              </div>
              <p className={s["bond-desc"]}><BondEffect def={bond} /></p>
            </div>
          )}
          {def.affinityRollable && !bond && <p className={s.muted}>这件装备没有羁绊词条。</p>}
        </div>
      ) : null}
    </TooltipCard>
  );
}
