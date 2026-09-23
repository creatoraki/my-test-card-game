// 疗养舱「设施升级」子页: 与商店 ShopUpgradePanel 同一块公共科技板, Esc / 返回按钮回到席位页。
import { useEffect, useMemo, useRef, useState } from "react";
import { useTownStore } from "@/store/townStore";
import { TechnologyBoard } from "@/ui/common/techTree/TechnologyBoard";
import {
  NUTRITION_TECHNOLOGY_CANVAS,
  NUTRITION_TECHNOLOGY_CORE,
  nutritionTechnologyNodes,
} from "./nutritionTechnologyView";
import s from "@/ui/common/techTree/techUpgradePanel.module.css";

export function NutritionUpgradePanel({ onBack }: { onBack: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const techs = useTownStore((state) => state.nutrition.techs);
  const researchNutritionTech = useTownStore((state) => state.researchNutritionTech);
  const nodes = useMemo(() => nutritionTechnologyNodes(techs, storage), [techs, storage]);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    nodes.find((node) => node.state === "available")?.id
    ?? nodes.find((node) => node.state === "lacking")?.id
    ?? nodes[0]?.id ?? null,
  );

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  return (
    <div
      ref={rootRef}
      className={s.panel}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onBack();
      }}
    >
      <TechnologyBoard
        nodes={nodes}
        core={NUTRITION_TECHNOLOGY_CORE}
        canvas={NUTRITION_TECHNOLOGY_CANVAS}
        selectedId={selectedId}
        credits={loot}
        returnLabel="返回疗养舱"
        onSelect={setSelectedId}
        onResearch={researchNutritionTech}
        onClose={onBack}
      />
    </div>
  );
}
