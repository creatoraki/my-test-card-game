// 物品详情 —— 背包面板与仓库设施的右栏共用。
// 操作按钮不写在这里: 两个界面能做的事不同(探索里是使用/丢弃/寄回, 据点里是穿戴/出售),
// 故用 children 插槽让调用方自己塞。本组件只负责「这件东西是什么」。

import type { ReactNode } from "react";
import { getBondDef, getCardModule, getItemDef } from "@/data";
import { STAT_KEYS } from "@/engine";
import type { StatBlock } from "@/engine";
import { rollToFlat } from "@/items/equipRoll";
import type { ItemStack } from "@/items/types";
import { CATEGORY_LABEL, RARITY_LABEL, SLOT_LABEL } from "@/items/types";
import { BondIcon } from "@/ui/common/BondIcon";
import { cx } from "@/ui/common/cx";
import { itemIcon } from "@/ui/art/itemArt";
import { isPercentStat } from "@/ui/common/statGroups";
import s from "./ItemDetail.module.css";

// 属性中文名。⚠ 与 CryoScene 的队员档案是同一套口径, 改名要一起改。
// ★ 导出给 ShopItemCard 复用 —— 商店的详情栏样式独立, 但**文案口径必须同一份**。
export const STAT_LABEL: Partial<Record<keyof StatBlock, string>> = {
  maxHp: "生命上限",
  attack: "攻击力",
  healPower: "治愈力",
  lowCostMastery: "低费精通",
  highCostMastery: "高费精通",
  defense: "防御力",
  armorPen: "穿甲",
  hitRate: "命中率",
  dodgeRate: "闪避率",
  critRate: "暴击率",
  critDamage: "爆伤",
  precision: "精准",
  initiative: "先手",
  blockRate: "格挡率",
  healBoost: "治愈强度",
  shieldBoost: "护盾强度",
  ailmentResist: "异常抗性",
  burdenAdapt: "负重适应",
  handLimit: "手牌上限",
  drawCount: "抽牌数",
};

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
          </p>
        </div>
      </div>

      <p className={s["item-detail-desc"]}>{def.desc}</p>

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

      {def.category === "material" && (
        <p className={cx(s["item-detail-note"], s["is-locked"])}>关键词模组尚未开放，先存进仓库。</p>
      )}
      {cardModule && (
        <dl className={s["item-detail-field"]}>
          <dt>装配条件</dt>
          <dd>{cardModule.equipText}</dd>
        </dl>
      )}
      {def.category === "data" && (
        <p className={cx(s["item-detail-note"], s["is-locked"])}>叙事解锁尚未开放，先存进仓库。</p>
      )}
      {/* 羁绊词条 —— 掉落时 roll 出来, 逐件独立(见 items/drops.rollAffinity)。
          ★ 计数只在**上阵角色**穿戴时才作数, 躺仓库里的这一条只是"这件东西带什么"。 */}
      {bond && (
        <div className={s["item-detail-bond"]}>
          <p className={s["item-detail-bond-head"]}>
            <BondIcon bondId={bond.id} className={s["item-detail-bond-icon"]} />
            <span className={s["item-detail-bond-name"]}>
              {bond.name}
              <span className={s["item-detail-bond-arcana"]}>{bond.arcana}</span>
            </span>
            <span className={s["item-detail-bond-count"]}>羁绊 +1</span>
          </p>
          <p className={s["item-detail-bond-desc"]}>{bond.desc}</p>
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

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
