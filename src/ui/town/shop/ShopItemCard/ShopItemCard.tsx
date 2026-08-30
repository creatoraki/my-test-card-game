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
import { getBondDef, getItemDef } from "@/data";
import { STAT_KEYS } from "@/engine";
import type { ItemStack } from "@/items/types";
import { rollToFlat } from "@/items/equipRoll";
import { CATEGORY_LABEL, RARITY_LABEL, RARITY_ORDER, SLOT_LABEL } from "@/items/types";
import { STAT_LABEL } from "@/ui/common/item/ItemDetail";
import { BondIcon } from "@/ui/common/BondIcon";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import { isPercentStat } from "@/ui/common/statGroups";
import s from "./ShopItemCard.module.css";

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const affixRole = (weight: number) => (weight === 3 ? "主" : weight === 2 ? "副" : "三");

export default function ShopItemCard({
  stack,
  placeholder,
}: {
  stack: ItemStack | null;
  placeholder?: string;
}) {
  if (!stack) {
    return (
      <div className={cx(s["sx-card"], s["is-idle"])}>
        <p className={s["sx-card-idle"]}>{placeholder ?? "选择一件商品查看详情"}</p>
      </div>
    );
  }

  const def = getItemDef(stack.itemId);
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  const flatMods = stack.roll ? rollToFlat(stack.roll) : def.mods?.flat;
  const pctMods = def.mods?.pct;
  const rows: { label: string; value: string; good: boolean }[] = [];
  for (const k of STAT_KEYS) {
    const flat = flatMods?.[k];
    const pct = pctMods?.[k];
    if (flat)
      rows.push({
        label: STAT_LABEL[k] ?? k,
        value: `${signed(flat)}${isPercentStat(k) ? "%" : ""}`,
        good: flat > 0,
      });
    if (pct)
      rows.push({
        label: STAT_LABEL[k] ?? k,
        value: `${signed(pct)}${isPercentStat(k) ? "%" : ""}`,
        good: pct > 0,
      });
  }

  return (
    // ★ 外壳与内容**必须**分开: 外壳(.sx-card)是这一栏唯一的 backdrop-filter 承载者,
    //   它要跨商品切换存活下来。以前整张卡挂在 ShopScene 的 key 上, 鼠标每划过一格
    //   就卸载重建一次玻璃层, 一次悬浮 = 重新采样一遍整屏背景, 这是最大的一处掉帧。
    //   现在只有内层 .sx-card-body 带 key 重挂载 —— 它不含 backdrop-filter, 淡入很便宜。
    <div className={cx(s["sx-card"], s[`sx-r-${def.rarity}`])}>
      <div className={s["sx-card-body"]} key={stack.uid}>
        {/* 商品展示台: 整栏通宽的大图, 是这一栏唯一的视觉焦点 */}
        <div className={s["sx-card-stage"]}>
          {/* 扫光带独立成节点: 它以前是 ::after 上一层 220% 宽的渐变, 靠 background-position
              做 5.6s 无限循环 —— 那是纯主线程重绘, 整个展示台每帧重画一遍。
              现在改成一条实体光带走 transform, 交给合成器。 */}
          <span className={s["sx-card-sweep"]} aria-hidden="true" />
          <span className={s["sx-card-icon"]}>{itemIcon(def)}</span>
        </div>

        <div className={s["sx-card-title-row"]}>
          <h4 className={s["sx-card-name"]}>
            {def.name}
            {stack.count > 1 && <span className={s["sx-card-mult"]}> ×{stack.count}</span>}
          </h4>

          {/* 羁绊标签与名称同排，固定在标题行右侧。 */}
          {bond && (
            <span
              className={s["sx-card-bond"]}
              style={{ "--sx-bond": bond.color } as CSSProperties}
              aria-label={`${bond.name}（${bond.arcana}）· ${bond.desc}`}
            >
              <BondIcon bondId={bond.id} className={s["sx-card-bond-icon"]} />
              <span className={s["sx-card-bond-name"]}>{bond.name}</span>
            </span>
          )}
        </div>

        <p className={s["sx-card-tags"]}>
          <span className={s["sx-card-rarity"]}>{RARITY_LABEL[def.rarity]}</span>
          <span>{CATEGORY_LABEL[def.category]}</span>
          {def.slot && <span>{SLOT_LABEL[def.slot]}</span>}
        </p>

        <p className={s["sx-card-desc"]}>{def.desc}</p>

        {def.model && stack.roll && (
          <>
            <p className={s["sx-card-note"]}>
              {RARITY_ORDER.indexOf(def.rarity) + 1}阶 · 模型值 {stack.roll.budget}
            </p>
            <dl className={s["sx-card-stats"]}>
              {def.model.affixes.map((affix) => (
                <div key={affix.stat}>
                  <dt>{affixRole(affix.weight)}词条 · {STAT_LABEL[affix.stat] ?? affix.stat}</dt>
                  <dd className={s["is-good"]}>{stack.roll.points[affix.stat] ?? 0} 点</dd>
                </div>
              ))}
            </dl>
            {def.model.drawbacks && stack.roll.cost != null && (
              <>
                <dl className={s["sx-card-stats"]}>
                  {def.model.drawbacks.map((affix) => (
                    <div key={affix.stat}>
                      <dt>代价 · {STAT_LABEL[affix.stat] ?? affix.stat}</dt>
                      <dd className={s["is-bad"]}>{stack.roll.points[affix.stat] ?? 0} 点</dd>
                    </div>
                  ))}
                </dl>
                <p className={s["sx-card-note"]}>
                  代价 {stack.roll.cost} 点 · 返还 {Math.round(stack.roll.cost * (def.model.costRefund ?? 0.7))} 点
                </p>
              </>
            )}
          </>
        )}

        {rows.length > 0 && (
          <dl className={s["sx-card-stats"]}>
            {rows.map((r) => (
              <div key={`${r.label}${r.value}`}>
                <dt>{r.label}</dt>
                <dd className={r.good ? s["is-good"] : s["is-bad"]}>{r.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* 脚注 —— 售价与各类"尚未开放"提示折叠进同一块最弱字号里, 不再各占一行主文本 */}
        <div className={s["sx-card-foot"]}>
          {def.sellValue != null && (
            <span className={s["sx-card-note"]}>回收台售价 {def.sellValue * stack.count}</span>
          )}
          {def.category === "material" && (
            <span className={cx(s["sx-card-note"], s["is-locked"])}>关键词模组尚未开放，先存进仓库。</span>
          )}
          {def.category === "data" && (
            <span className={cx(s["sx-card-note"], s["is-locked"])}>叙事解锁尚未开放，先存进仓库。</span>
          )}
          {def.affinityRollable && !bond && (
            <span className={cx(s["sx-card-note"], s["is-locked"])}>这件装备没有羁绊词条。</span>
          )}
        </div>
      </div>
    </div>
  );
}
