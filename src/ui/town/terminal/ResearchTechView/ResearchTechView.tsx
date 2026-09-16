// 研究中心「科技树」页: 公共科技板 + 分类页签, 研究动作只派发 townStore.researchTech。
import { useEffect, useMemo, useState } from "react";
import { TECH_CATEGORIES } from "@/data";
import { useTownStore } from "@/store/townStore";
import { TechnologyBoard } from "@/ui/common/techTree/TechnologyBoard";
import type { TechnologyTab } from "@/ui/common/techTree/TechnologyTree";
import {
  RESEARCH_TECHNOLOGY_CANVAS,
  researchCategoryLevel,
  researchTechnologyCore,
  researchTechnologyNodes,
} from "./researchTechnologyView";
import s from "./ResearchTechView.module.css";

export function ResearchTechView() {
  const techTree = useTownStore((state) => state.techTree);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const researchTech = useTownStore((state) => state.researchTech);
  const [categoryId, setCategoryId] = useState(TECH_CATEGORIES[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodes = useMemo(
    () => researchTechnologyNodes(categoryId, techTree.levels, loot, storage),
    [categoryId, loot, storage, techTree.levels],
  );
  const core = useMemo(() => researchTechnologyCore(categoryId), [categoryId]);
  const tabs = useMemo<TechnologyTab[]>(
    () => TECH_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.name,
      desc: category.desc,
      badge: `已投入 Lv.${researchCategoryLevel(category.id, techTree.levels)}`,
    })),
    [techTree.levels],
  );

  // 换分类后原选中节点多半不在新分类里, 回落到第一个节点。
  useEffect(() => {
    if (!nodes.some((node) => node.id === selectedId)) setSelectedId(nodes[0]?.id ?? null);
  }, [nodes, selectedId]);

  const totalLevel = TECH_CATEGORIES.reduce(
    (sum, category) => sum + researchCategoryLevel(category.id, techTree.levels),
    0,
  );

  return (
    <TechnologyBoard
      className={s.board}
      nodes={nodes}
      core={core}
      canvas={RESEARCH_TECHNOLOGY_CANVAS}
      selectedId={selectedId}
      credits={loot}
      tabs={tabs}
      activeTabId={categoryId}
      tabsLabel="科技分类"
      progressLabel="已投入等级"
      progressValue={`Lv.${totalLevel}`}
      onTabChange={setCategoryId}
      onSelect={setSelectedId}
      onResearch={researchTech}
    />
  );
}
