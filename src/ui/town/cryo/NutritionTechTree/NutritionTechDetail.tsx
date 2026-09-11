import {
  NUTRITION_MAX_LEVEL,
  NUTRITION_POD_MAX,
  NUTRITION_TECHS,
  nutritionHeal,
  nutritionLevel,
  nutritionPods,
  nutritionTechCost,
  nutritionTechState,
  type NutritionTechState,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { TechCostMaterials } from "@/ui/common/tech/TechCostMaterials";
import s from "./NutritionTechDetail.module.css";

interface Props {
  selectedId: string | null;
  doneTechs: string[];
  storage: ItemStack[];
  onResearch: (techId: string) => void;
}

const STATE_TEXT: Record<NutritionTechState, string> = {
  done: "已研究, 效果已生效",
  available: "前置已完成, 可以研究",
  lacking: "前置已完成, 但材料不足",
  locked: "需要先完成前置节点",
};

export function NutritionTechDetail({ selectedId, doneTechs, storage, onResearch }: Props) {
  const tech = NUTRITION_TECHS.find((entry) => entry.id === selectedId);
  const level = nutritionLevel(doneTechs);

  if (!tech) {
    return (
      <aside className={s.detail} aria-label="疗养舱当前概览">
        <span className={s.kicker}>当前概览</span>
        <h3>疗养舱状态</h3>
        <div className={s.overviewGrid}>
          <OverviewItem label="科技等级" value={`Lv.${level}`} />
          <OverviewItem label="席位" value={`${nutritionPods(doneTechs)} / ${NUTRITION_POD_MAX}`} />
          <OverviewItem label="单次恢复" value={`+${nutritionHeal(doneTechs)}`} />
          <OverviewItem label="最高等级" value={`Lv.${NUTRITION_MAX_LEVEL}`} />
        </div>
        <p className={s.empty}>选择左侧节点查看解锁消耗与实际效果。</p>
      </aside>
    );
  }

  const state = nutritionTechState(tech, doneTechs, storage);
  const cost = nutritionTechCost(tech, storage);
  const branch = tech.kind === "capacity" ? "席位扩建" : "疗养液配比";

  return (
    <aside className={s.detail} aria-label={`${tech.name}详情`}>
      <span className={s.kicker}>{branch}</span>
      <h3>{tech.name}</h3>
      <p className={s.desc}>{tech.desc}</p>
      <div className={s.section}>
        <span className={s.sectionTitle}>升级材料</span>
        <TechCostMaterials materials={cost.materials} done={state === "done"} />
      </div>
      <div className={s.status} data-state={state}>
        <span className={s.sectionTitle}>节点状态</span>
        <span>{STATE_TEXT[state]}</span>
      </div>
      <button className={s.research} type="button" disabled={state !== "available"} onClick={() => onResearch(tech.id)}>
        {state === "done" ? "已研究" : "研究"}
      </button>
    </aside>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.overviewItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
