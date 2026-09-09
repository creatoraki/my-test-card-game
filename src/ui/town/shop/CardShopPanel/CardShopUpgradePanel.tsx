import { useState, type CSSProperties } from "react";
import type { ItemStack } from "@/items/types";
import { CardShopTechDetail, CardShopTechTree } from "./UpgradeTree";
import s from "./CardShopUpgradePanel.module.css";

interface Props {
  level: number;
  doneTechs: string[];
  storage: ItemStack[];
  loot: number;
  origin: { x: number; y: number };
  closing: boolean;
  onResearch: (techId: string) => void;
  onClose: () => void;
  onClosed: () => void;
}

export function CardShopUpgradePanel({ level, doneTechs, storage, loot, origin, closing, onResearch, onClose, onClosed }: Props) {
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  return (
    <div
      className={`${s.overlay} ${closing ? s["is-closing"] : ""}`}
      style={{ "--from-x": `${origin.x}px`, "--from-y": `${origin.y}px` } as CSSProperties}
      onAnimationEnd={(event) => event.target === event.currentTarget && closing && onClosed()}
    >
      <div className={s.dialog} role="dialog" aria-label="卡牌商店设施升级">
        <div className={s.head}>
          <div>
            <span className={s.kicker}>卡牌展柜维护系统</span>
            <h4>设施升级 · 等级 {level}</h4>
            <p>提升货位数量与每日刷新效率</p>
          </div>
          <button className={s.close} type="button" onClick={onClose} aria-label="关闭设施升级">✕</button>
        </div>
        <div className={s.layout}>
          <CardShopTechTree
            doneTechs={doneTechs}
            loot={loot}
            storage={storage}
            selectedId={selectedTechId}
            onSelect={setSelectedTechId}
          />
          <CardShopTechDetail
            selectedId={selectedTechId}
            doneTechs={doneTechs}
            loot={loot}
            storage={storage}
            onResearch={onResearch}
          />
        </div>
      </div>
    </div>
  );
}
