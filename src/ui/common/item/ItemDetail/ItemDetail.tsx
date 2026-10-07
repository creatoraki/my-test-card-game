import { BondEffect } from "@/ui/common/bond/BondEffect";
// 物品详情 —— 背包面板与仓库设施的右栏共用。
// 操作按钮不写在这里: 两个界面能做的事不同(探索里是使用/丢弃/寄回, 据点里是穿戴/出售),
// 故用 children 插槽让调用方自己塞。本组件只负责「这件东西是什么」。
// 悬浮详情走 ItemTooltipCard(TooltipCard 款式); 两者的数据口径统一在 itemDetailData。

import type { ReactNode } from "react";
import { getBondDef, getCardModule, getItemDef } from "@/data";
import { rollPerfectness } from "@/items/equipRoll";
import type { ItemStack } from "@/items/types";
import {
  CATEGORY_LABEL,
  RARITY_LABEL,
  RELIC_POLARITY_LABEL,
  RELIC_SCOPE_LABEL,
  SLOT_LABEL,
} from "@/items/types";
import { BondIcon } from "@/ui/common/bond/BondIcon";
import { cx } from "@/ui/common/shared/cx";
import { itemIcon } from "@/ui/art/items/itemArt";
import { itemStatRows, relicTriggerText } from "./itemDetailData";
import s from "./ItemDetail.module.css";

export { STAT_LABEL } from "./itemDetailData";

export default function ItemDetail({
  stack,
  placeholder,
  children,
  className,
}: {
  stack: ItemStack | null;
  placeholder?: string;
  children?: ReactNode;
  /** 调用方的布局类(详情栏在自己的面板里怎么占位)。外观一律由本组件持有。 */
  className?: string;
}) {
  if (!stack) {
    return (
      <div className={cx(s["item-detail"], s["is-idle"], className)}>
        <p className={s["item-detail-idle"]}>{placeholder ?? "选择一件物品查看详情"}</p>
      </div>
    );
  }

  const def = getItemDef(stack.itemId);
  // def.affinity = 羁绊饰品的固定羁绊; stack.affinity = 掉落时 roll 出的随机羁绊。
  // 本期只会有后者, 但两者的展示是同一套, 先一并取。
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  // 模组的装配条件独立成字段展示 —— 正文只说装配后的效果, 条件不再混在 desc 里。
  const cardModule = def.category === "module" ? getCardModule(def.id) : undefined;
  const rows = itemStatRows(stack, def);

  return (
    <div className={cx(s["item-detail"], s[`r-${def.rarity}`], className)}>
      <div className={s["item-detail-head"]}>
        <span className={s["item-detail-icon"]}>{itemIcon(def)}</span>
        <div>
          <h4 className={s["item-detail-name"]}>
            {def.name}
            {stack.count > 1 && <span className={s["item-detail-mult"]}> ×{stack.count}</span>}
          </h4>
          <p className={s["item-detail-tags"]}>
            <span className={s["item-detail-rarity"]}>{RARITY_LABEL[def.rarity]}</span>
            <span>{CATEGORY_LABEL[def.category]}</span>
            {def.slot && <span>{SLOT_LABEL[def.slot]}</span>}
            {def.category === "equipment" && stack.roll && (
              <span className={s["item-detail-perfectness"]}>完美度 {rollPerfectness(def, stack.roll)}</span>
            )}
          </p>
        </div>
      </div>

      <p className={s["item-detail-desc"]}>{def.desc}</p>

      {stack.disposable && (
        <p className={s["item-detail-disposable"]}>
          一次性物品：远征结束后自动销毁，无法带回仓库，也无法通过羽翼信使寄回。
        </p>
      )}

      {def.relic && (
        <div className={s["item-detail-relic"]}>
          <strong>{RELIC_POLARITY_LABEL[def.relic.polarity]}</strong>
          <span>{RELIC_SCOPE_LABEL[def.relic.scope]}</span>
          {def.relic.on && <span>{relicTriggerText(def.relic.on)}触发</span>}
          {def.relic.every && <span>每 {def.relic.every} 次触发结算</span>}
          {def.relic.purifyTo && <span>可在圣水池净化</span>}
        </div>
      )}

      {rows.length > 0 && (
        <dl className={s["item-detail-stats"]}>
          {rows.map((r) => (
            <div key={`${r.label}${r.value}`}>
              <dt>{r.label}</dt>
              <dd className={r.good ? s["is-good"] : s["is-bad"]}>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {cardModule && (
        <dl className={s["item-detail-field"]}>
          <dt>装配条件</dt>
          <dd>{cardModule.equipText}</dd>
        </dl>
      )}
      {/* 羁绊词条 —— 掉落时 roll 出来, 逐件独立(见 items/drops.rollAffinity)。
          ★ 计数只在**上阵角色**穿戴时才作数, 躺仓库里的这一条只是"这件东西带什么"。 */}
      {bond && (
        <div className={s["item-detail-bond"]}>
          <div className={s["item-detail-bond-head"]}>
            <BondIcon bondId={bond.id} className={s["item-detail-bond-icon"]} />
            <span className={s["item-detail-bond-name"]}>
              {bond.name}
              <span className={s["item-detail-bond-arcana"]}>{bond.arcana}</span>
            </span>
            <span className={s["item-detail-bond-count"]}>羁绊 +1</span>
          </div>
          <p className={s["item-detail-bond-desc"]}><BondEffect def={bond} /></p>
        </div>
      )}
      {/* 有 affinityRollable 却没 roll 到词条(如旧存档残留 / 已下线的羁绊 id) ——
          说清楚, 别让玩家以为是 bug。 */}
      {def.affinityRollable && !bond && (
        <p className={cx(s["item-detail-note"], s["is-locked"])}>这件装备没有羁绊词条。</p>
      )}

      {children && <div className={s["item-detail-actions"]}>{children}</div>}
    </div>
  );
}
