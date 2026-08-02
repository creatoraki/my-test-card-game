// 物品详情 —— 背包面板与仓库设施的右栏共用。
// 操作按钮不写在这里: 两个界面能做的事不同(探索里是使用/丢弃/寄回, 据点里是穿戴/出售),
// 故用 children 插槽让调用方自己塞。本组件只负责「这件东西是什么」。

import type { ReactNode } from "react";
import { getItemDef } from "../data";
import { STAT_KEYS } from "../engine";
import type { StatBlock } from "../engine";
import type { ItemStack } from "../items/types";
import { CATEGORY_LABEL, RARITY_LABEL, SLOT_LABEL } from "../items/types";
import { itemIcon } from "./itemArt";
import "./ItemDetail.css";

// 属性中文名。⚠ 与 CryoScene 的队员档案是同一套口径, 改名要一起改。
const STAT_LABEL: Partial<Record<keyof StatBlock, string>> = {
  maxHp: "生命上限",
  attack: "攻击力",
  healPower: "治愈力",
  defense: "防御力",
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
}: {
  stack: ItemStack | null;
  placeholder?: string;
  children?: ReactNode;
}) {
  if (!stack) {
    return (
      <div className="item-detail is-idle">
        <p className="item-detail-idle">{placeholder ?? "选择一件物品查看详情"}</p>
      </div>
    );
  }

  const def = getItemDef(stack.itemId);
  const mods = def.mods;
  const rows: { label: string; value: string; good: boolean }[] = [];
  for (const k of STAT_KEYS) {
    const flat = mods?.flat?.[k];
    const pct = mods?.pct?.[k];
    if (flat) rows.push({ label: STAT_LABEL[k] ?? k, value: signed(flat), good: flat > 0 });
    if (pct) rows.push({ label: `${STAT_LABEL[k] ?? k}(%)`, value: signed(pct), good: pct > 0 });
  }

  return (
    <div className={`item-detail r-${def.rarity}`}>
      <div className="item-detail-head">
        <span className="item-detail-icon">{itemIcon(def)}</span>
        <div>
          <h4 className="item-detail-name">
            {def.name}
            {stack.count > 1 && <span className="item-detail-mult"> ×{stack.count}</span>}
          </h4>
          <p className="item-detail-tags">
            <span className="item-detail-rarity">{RARITY_LABEL[def.rarity]}</span>
            <span>{CATEGORY_LABEL[def.category]}</span>
            {def.slot && <span>{SLOT_LABEL[def.slot]}</span>}
          </p>
        </div>
      </div>

      <p className="item-detail-desc">{def.desc}</p>

      {rows.length > 0 && (
        <dl className="item-detail-stats">
          {rows.map((r) => (
            <div key={`${r.label}${r.value}`}>
              <dt>{r.label}</dt>
              <dd className={r.good ? "is-good" : "is-bad"}>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {def.sellValue != null && (
        <p className="item-detail-note">回收台售价 {def.sellValue * stack.count} 居民积分</p>
      )}
      {def.category === "material" && (
        <p className="item-detail-note is-locked">关键词模组尚未开放，先存进仓库。</p>
      )}
      {def.category === "data" && (
        <p className="item-detail-note is-locked">叙事解锁尚未开放，先存进仓库。</p>
      )}
      {/* ⚠ 随机羁绊词条本期不生成 —— 但装备上写着 affinityRollable, 得让玩家知道那不是 bug */}
      {def.affinityRollable && (
        <p className="item-detail-note is-locked">羁绊词条尚未开放。</p>
      )}

      {children && <div className="item-detail-actions">{children}</div>}
    </div>
  );
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
