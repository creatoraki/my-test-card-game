// 货位商品详情 —— **交易终端专属**, 与背包/仓库共用的 ItemDetail 无样式关系。
//
// ★ 为什么不直接用 ItemDetail: 它的头图是一枚裸图标, 而本页的铁律是
//   「物品图标永远被 1:1 边框包裹、文字一律排在框外」。这里把头图换成 ItemIconFrame,
//   其余结构自建 —— 与据点商店 ShopItemCard 的取舍完全一致。
//
// 复用的是**数据与文案**: STAT_LABEL 从 ItemDetail 导入(口径必须同一份),
// STAT_KEYS / RARITY_LABEL / CATEGORY_LABEL / SLOT_LABEL / rollToFlat 照旧。

import { useMemo, type CSSProperties } from "react";
import { getBondDef, getItemDef } from "@/data";
import { STAT_KEYS } from "@/engine";
import { rollPerfectness, rollToFlat } from "@/items/equipRoll";
import type { ItemStack } from "@/items/types";
import { CATEGORY_LABEL, RARITY_LABEL, SLOT_LABEL } from "@/items/types";
import { BondIcon } from "@/ui/common/BondIcon";
import { cx } from "@/ui/common/cx";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import { STAT_LABEL } from "@/ui/common/item/ItemDetail";
import { isPercentStat } from "@/ui/common/statGroups";
import s from "./TradeGoodsDetail.module.css";

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export default function TradeGoodsDetail({ stack }: { stack: ItemStack }) {
  const def = getItemDef(stack.itemId);
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  const rows = useMemo(() => {
    const flatMods = stack.roll ? rollToFlat(stack.roll) : def.mods?.flat;
    const pctMods = def.mods?.pct;
    const next: { label: string; value: string; good: boolean }[] = [];
    for (const key of STAT_KEYS) {
      const flat = flatMods?.[key];
      const pct = pctMods?.[key];
      if (flat) {
        next.push({
          label: STAT_LABEL[key] ?? key,
          value: `${signed(flat)}${isPercentStat(key) ? "%" : ""}`,
          good: flat > 0,
        });
      }
      if (pct) {
        next.push({
          label: STAT_LABEL[key] ?? key,
          value: `${signed(pct)}${isPercentStat(key) ? "%" : ""}`,
          good: pct > 0,
        });
      }
    }
    return next;
  }, [def, stack]);

  return (
    <article className={cx(s.goods, s[`r-${def.rarity}`])}>
      {/* 展示台: 1:1 边框只裹图标, 名称与标签全部排在框外。 */}
      <div className={s.head}>
        <ItemIconFrame itemId={stack.itemId} size="lg" className={s.headIcon} />
        <div className={s.headCopy}>
          <h4 className={s.name}>
            {def.name}
            {stack.count > 1 && <span className={s.mult}> ×{stack.count}</span>}
          </h4>
          <p className={s.tags}>
            <span className={s.rarity}>{RARITY_LABEL[def.rarity]}</span>
            <span>{CATEGORY_LABEL[def.category]}</span>
            {def.slot && <span>{SLOT_LABEL[def.slot]}</span>}
            {def.category === "equipment" && stack.roll && (
              <span className={s.perfectness}>完美度 {rollPerfectness(def, stack.roll)}</span>
            )}
          </p>
        </div>
      </div>

      <p className={s.desc}>{def.desc}</p>

      {rows.length > 0 && (
        <dl className={s.stats}>
          {rows.map((row) => (
            <div key={`${row.label}${row.value}`}>
              <dt>{row.label}</dt>
              <dd className={row.good ? s.good : s.bad}>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {bond && (
        <div className={s.bond} style={{ "--bond": bond.color } as CSSProperties}>
          <div className={s.bondHead}>
            <BondIcon bondId={bond.id} className={s.bondIcon} />
            <span className={s.bondName}>
              {bond.name}
              <span className={s.bondArcana}>{bond.arcana}</span>
            </span>
          </div>
          <p className={s.bondDesc}>{bond.desc}</p>
        </div>
      )}

      {def.category === "material" && <p className={s.note}>关键词模组尚未开放，先存进仓库。</p>}
      {def.category === "data" && <p className={s.note}>叙事解锁尚未开放，先存进仓库。</p>}
      {def.affinityRollable && !bond && <p className={s.note}>这件装备没有羁绊词条。</p>}
    </article>
  );
}
