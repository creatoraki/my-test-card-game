// 商店商品详情 —— **商店专属**, 与背包/仓库共用的 ItemDetail 无任何样式关系。
//
// ★ 结构与 ItemDetail 同源, 但商店这边的最终形态本就不同(3D 展示柜、透明玻璃底、
//   稀有度只走描边), 以前靠 ShopScene.css 远程改写 .item-detail 的 6 个选择器实现 ——
//   现在直接内建, 商店想怎么定制都不会碰到另外四个用到 ItemDetail 的界面。
//
// 复用的是**数据与文案**: STAT_LABEL 从 ItemDetail 导入(口径必须同一份),
// STAT_KEYS / RARITY_LABEL / CATEGORY_LABEL / SLOT_LABEL / itemIcon 照旧。
//
// ★ 本栏是**纯展示**位, 没有任何操作控件 —— 购买在货架格底部的价格牌上(见 ShopScene)。
//   信息层级自上而下: 大图 > 名称 > 羁绊 tag / 标签 > 描述 > 属性数值 > 脚注,
//   靠字号与字色拉开档次, 不靠分隔框 —— 框太多这一栏就又读成表单了。

import type { CSSProperties } from "react";
import { getBondDef, getItemDef } from "../data";
import { STAT_KEYS } from "../engine";
import type { ItemStack } from "../items/types";
import { CATEGORY_LABEL, RARITY_LABEL, SLOT_LABEL } from "../items/types";
import { STAT_LABEL } from "./ItemDetail";
import { BondIcon } from "./BondIcon";
import { itemIcon } from "./itemArt";

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export default function ShopItemCard({
  stack,
  placeholder,
}: {
  stack: ItemStack | null;
  placeholder?: string;
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
      {/* 商品展示台: 整栏通宽的大图, 是这一栏唯一的视觉焦点 */}
      <div className="sx-card-stage">
        <span className="sx-card-icon">{itemIcon(def)}</span>
      </div>

      <h4 className="sx-card-name">
        {def.name}
        {stack.count > 1 && <span className="sx-card-mult"> ×{stack.count}</span>}
      </h4>

      <p className="sx-card-tags">
        <span className="sx-card-rarity">{RARITY_LABEL[def.rarity]}</span>
        <span>{CATEGORY_LABEL[def.category]}</span>
        {def.slot && <span>{SLOT_LABEL[def.slot]}</span>}
      </p>

      {/* 羁绊 —— 精简成一个彩色 tag: 颜色即身份(见 data/bonds.ts 的 BondDef.color),
          六条羁绊各一个色相, 扫一眼就认得出。效果说明挂 title, 想看再悬浮。 */}
      {bond && (
        <span
          className="sx-card-bond"
          style={{ "--sx-bond": bond.color } as CSSProperties}
          title={`${bond.name}（${bond.arcana}）· ${bond.desc}`}
        >
          <BondIcon bondId={bond.id} className="sx-card-bond-icon" />
          <span className="sx-card-bond-name">{bond.name}</span>
        </span>
      )}

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

      {/* 脚注 —— 售价与各类"尚未开放"提示折叠进同一块最弱字号里, 不再各占一行主文本 */}
      <div className="sx-card-foot">
        {def.sellValue != null && (
          <span className="sx-card-note">回收台售价 {def.sellValue * stack.count}</span>
        )}
        {def.category === "material" && (
          <span className="sx-card-note is-locked">关键词模组尚未开放，先存进仓库。</span>
        )}
        {def.category === "data" && (
          <span className="sx-card-note is-locked">叙事解锁尚未开放，先存进仓库。</span>
        )}
        {def.affinityRollable && !bond && (
          <span className="sx-card-note is-locked">这件装备没有羁绊词条。</span>
        )}
      </div>
    </div>
  );
}
