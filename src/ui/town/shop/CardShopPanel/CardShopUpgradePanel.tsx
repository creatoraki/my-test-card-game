import type { CSSProperties } from "react";
import {
  CARD_SHOP_MAX_LEVEL,
  cardShopTechsOfTier,
  isCardShopTechAvailable,
  techCostCheck,
} from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
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
        {level >= CARD_SHOP_MAX_LEVEL ? (
          <div className={s.maxed}>卡牌商店已达最高等级</div>
        ) : (
          <div className={s.techs}>
            {cardShopTechsOfTier(level).map((tech) => {
              const done = doneTechs.includes(tech.id);
              const check = techCostCheck(tech, loot, storage);
              const available = isCardShopTechAvailable(tech, doneTechs);
              return (
                <div className={`${s.tech} ${done ? s["is-done"] : ""}`} key={tech.id}>
                  <span className={s.techName}>{tech.name} {done ? "✓" : ""}</span>
                  <span className={s.techDesc}>{tech.desc}</span>
                  <div className={s.materials}>
                    <span className={`${s.material} ${check.lootOk ? "" : s["is-lacking"]}`}>积分 {tech.loot}</span>
                    {check.materials.map((material) => {
                      const stack: ItemStack = {
                        uid: `card-shop-${material.itemId}`,
                        itemId: material.itemId,
                        count: Math.max(material.have, 1),
                      };
                      return (
                        <span className={`${s.material} ${material.ok ? "" : s["is-lacking"]}`} key={material.itemId}>
                          <ItemSlot stack={stack} showName={false} disabled={!material.have} className={s.materialSlot} />
                          ×{material.need}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    className={s.research}
                    type="button"
                    disabled={done || !available || !check.ok}
                    onClick={() => onResearch(tech.id)}
                  >
                    {done ? "已研究" : "研究"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
