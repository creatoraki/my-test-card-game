import { NUTRITION_MAX_LEVEL, NUTRITION_TECHS, isTechAvailable, nutritionPods, nutritionTechCheck, nutritionTechsOfTier } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import s from "./NutritionUpgradePanel.module.css";

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

export function NutritionUpgradePanel({ level, doneTechs, storage, loot, origin, closing, onResearch, onClose, onClosed }: Props) {
  return (
    <div
      className={`${s.overlay} ${closing ? s["is-closing"] : ""}`}
      style={{ "--from-x": `${origin.x}px`, "--from-y": `${origin.y}px` } as React.CSSProperties}
      onAnimationEnd={(event) => event.target === event.currentTarget && closing && onClosed()}
    >
      <div className={s.dialog} role="dialog" aria-label="营养舱科技">
        <div className={s.head}>
          <div>
            <span className={s.kicker}>营养液循环系统</span>
            <h4>科技升级 · 等级 {level}</h4>
            <p>当前舱位 {nutritionPods(doneTechs)} / {NUTRITION_MAX_LEVEL}</p>
          </div>
          <button className={s.close} type="button" onClick={onClose} aria-label="关闭科技升级">✕</button>
        </div>
        {level >= NUTRITION_MAX_LEVEL ? (
          <div className={s.maxed}>营养舱已达最高等级</div>
        ) : (
          <div className={s.techs}>
            {nutritionTechsOfTier(level).map((tech) => (
              <TechCard key={tech.id} tech={tech} done={doneTechs.includes(tech.id)} doneTechs={doneTechs} storage={storage} loot={loot} onResearch={onResearch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TechCard({ tech, done, doneTechs, storage, loot, onResearch }: { tech: (typeof NUTRITION_TECHS)[number]; done: boolean; doneTechs: string[]; storage: ItemStack[]; loot: number; onResearch: (techId: string) => void }) {
  const check = nutritionTechCheck(tech, loot, storage);
  const available = isTechAvailable(tech, doneTechs);
  return (
    <div className={`${s.tech} ${done ? s["is-done"] : ""}`}>
      <span className={s.techName}>{tech.name} {done ? "✓" : ""}</span>
      <span className={s.techDesc}>{tech.desc}</span>
      <div className={s.materials}>
        <span className={`${s.material} ${check.lootOk ? "" : s["is-lacking"]}`}>积分 {tech.loot}</span>
        {check.materials.map((material) => {
          const stack: ItemStack = { uid: `nutrition-${material.itemId}`, itemId: material.itemId, count: Math.max(material.have, 1) };
          return <span key={material.itemId} className={`${s.material} ${material.ok ? "" : s["is-lacking"]}`}><ItemSlot stack={stack} showName={false} disabled={!material.have} className={s.materialSlot} />×{material.need}</span>;
        })}
      </div>
      <button className={s.research} type="button" disabled={done || !available || !check.ok} onClick={() => onResearch(tech.id)}>{done ? "已研究" : "研究"}</button>
    </div>
  );
}