import { useState, type CSSProperties } from "react";
import type { ItemStack } from "@/items/types";
import { ShopTechDetail, ShopTechTree } from "./UpgradeTree";
import s from "./MarketUpgradePanel.module.css";

interface Props {
  level: number;
  doneTechs: string[];
  storage: ItemStack[];
  origin: { x: number; y: number };
  closing: boolean;
  onResearch: (techId: string) => void;
  onClose: () => void;
  onClosed: () => void;
}

export function MarketUpgradePanel({ level, doneTechs, storage, origin, closing, onResearch, onClose, onClosed }: Props) {
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  return (
    <div
      className={`${s.overlay} ${closing ? s["is-closing"] : ""}`}
      style={{ "--from-x": `${origin.x}px`, "--from-y": `${origin.y}px` } as CSSProperties}
      onAnimationEnd={(event) => event.target === event.currentTarget && closing && onClosed()}
    >
      <div className={s.dialog} role="dialog" aria-label="商店设施升级">
        <div className={s.head}>
          <div>
            <span className={s.kicker}>商店货架维护系统</span>
            <h4>设施升级 · 等级 {level}</h4>
            <p>提升货位数量与每日刷新效率</p>
          </div>
          <button className={s.close} type="button" onClick={onClose} aria-label="关闭设施升级">✕</button>
        </div>
        <div className={s.layout}>
          <ShopTechTree
            doneTechs={doneTechs}
            storage={storage}
            selectedId={selectedTechId}
            onSelect={setSelectedTechId}
          />
          <ShopTechDetail
            selectedId={selectedTechId}
            doneTechs={doneTechs}
            storage={storage}
            onResearch={onResearch}
          />
        </div>
      </div>
    </div>
  );
}
