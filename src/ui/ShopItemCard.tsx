// 商店商品详情 —— **商店专属**, 与背包/仓库共用的 ItemDetail 无任何样式关系。
//
// ★ 结构与 ItemDetail 同源, 但商店这边的最终形态本就不同(3D 展示柜、透明玻璃底、
//   稀有度只走描边), 以前靠 ShopScene.css 远程改写 .item-detail 的 6 个选择器实现 ——
//   现在直接内建, 商店想怎么定制都不会碰到另外四个用到 ItemDetail 的界面。
//
// 复用的是**数据与文案**: STAT_LABEL 从 ItemDetail 导入(口径必须同一份),
// STAT_KEYS / RARITY_LABEL / CATEGORY_LABEL / SLOT_LABEL / itemIcon 照旧。

import type { ReactNode } from "react";
import { getBondDef, getItemDef } from "../data";
import { STAT_KEYS } from "../engine";
import type { ItemStack } from "../items/types";
import { CATEGORY_LABEL, RARITY_LABEL, SLOT_LABEL } from "../items/types";
import { STAT_LABEL } from "./ItemDetail";
import { itemIcon } from "./itemArt";

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export default function ShopItemCard({
  stack,
  placeholder,
  children,
}: {
  stack: ItemStack | null;
  placeholder?: string;
  children?: ReactNode;
}) {
  if (!stack) {
    return (
      <div className="sx-card is-idle">
        <p className="sx-card-idle">{placeholder ?? "选择一件商品查看详情"}</p>
      </div>
    );
  }

  const def = getItemDef(stack.itemId);
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  const mods = def.mods;
  const rows: { label: string; value: string; good: boolean }[] = [];
  for (const k of STAT_KEYS) {
    const flat = mods?.flat?.[k];
    const pct = mods?.pct?.[k];
    if (flat) rows.push({ label: STAT_LABEL[k] ?? k, value: signed(flat), good: flat > 0 });
    if (pct) rows.push({ label: `${STAT_LABEL[k] ?? k}(%)`, value: signed(pct), good: pct > 0 });
  }

  return (
    <div className={`sx-card sx-r-${def.rarity}`}>
      {/* 商品展示柜: 图标浮在 3D 玻璃底座上, 是这一栏的视觉焦点 */}
      <div className="sx-card-head">
        <span className="sx-card-icon">{itemIcon(def)}</span>
        <div>
          <h4 className="sx-card-name">
            {def.name}
            {stack.count > 1 && <span className="sx-card-mult"> ×{stack.count}</span>}
          </h4>
          <p className="sx-card-tags">
            <span className="sx-card-rarity">{RARITY_LABEL[def.rarity]}</span>
            <span>{CATEGORY_LABEL[def.category]}</span>
            {def.slot && <span>{SLOT_LABEL[def.slot]}</span>}
          </p>
        </div>
      </div>

      <p className="sx-card-desc">{def.desc}</p>

      {rows.length > 0 && (
        <dl className="sx-card-stats">
          {rows.map((r) => (
            <div key={`${r.label}${r.value}`}>
              <dt>{r.label}</dt>
              <dd className={r.good ? "is-good" : "is-bad"}>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {def.sellValue != null && (
        <p className="sx-card-note">回收台售价 {def.sellValue * stack.count} 居民积分</p>
      )}
      {def.category === "material" && (
        <p className="sx-card-note is-locked">关键词模组尚未开放，先存进仓库。</p>
      )}
      {def.category === "data" && (
        <p className="sx-card-note is-locked">叙事解锁尚未开放，先存进仓库。</p>
      )}
      {bond && (
        <div className="sx-card-bond">
          <p className="sx-card-bond-head">
            <span className="sx-card-bond-emoji">{bond.emoji}</span>
            <span className="sx-card-bond-name">
              {bond.name}
              <span className="sx-card-bond-arcana">{bond.arcana}</span>
            </span>
            <span className="sx-card-bond-count">羁绊 +1</span>
          </p>
          <p className="sx-card-bond-desc">{bond.desc}</p>
        </div>
      )}
      {def.affinityRollable && !bond && (
        <p className="sx-card-note is-locked">这件装备没有羁绊词条。</p>
      )}

      {/* 购买徽章由 ShopScene 塞进来 —— 本组件只负责「这件东西是什么」 */}
      {children && <div className="sx-card-actions">{children}</div>}
    </div>
  );
}
