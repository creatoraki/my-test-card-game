// 新皮肤卡面右上的徽记列(354×483 设计 px): 只收「卡牌本体」的角标 —— 污染病毒符号 → 已装模组。
// 老卡面里: 模组在右上 10px(会被新钢框右上角板压住)、病毒符号在右上 6px —— 新皮肤统一 52px 插槽 + 悬停浮出 TooltipCard 释义。
// 卡牌标记 / 培育 / 共鸣 / 缠根 这类战斗标记默认排在卡外左上(face/PickFaceMarks); 卡上方没空位的场合由 extra 并进本列。
import type { ReactNode } from "react";
import type { Card } from "@/engine";
import { getItemDef } from "@/data";
import { itemIcon } from "@/ui/art/items/itemArt";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import { PollutionVirusMark } from "@/ui/common/card/HandCard/parts/PollutionVirusMark";
import { PickSocket, socketIconClass } from "./PickSocket";
import s from "./PickFaceBadges.module.css";

export function PickFaceBadges({ card, extra = [] }: { card: Card; extra?: ReactNode[] }) {
  const module = card.cardModule ? getItemDef(card.cardModule.itemId) : null;
  if (!card.contaminated && !module && !extra.length) return null;

  return (
    <div className={s.column}>
      {card.contaminated && (
        <PickSocket kind="virus" tip={<TooltipCard title="污染" desc="这张牌已被污染。" />}>
          <span className={s.virus}><PollutionVirusMark /></span>
        </PickSocket>
      )}
      {module && (
        <PickSocket kind="module" tip={<TooltipCard icon={itemIcon(module)} title={module.name} desc={module.desc} />}>
          <span className={socketIconClass}>{itemIcon(module)}</span>
        </PickSocket>
      )}
      {extra}
    </div>
  );
}
