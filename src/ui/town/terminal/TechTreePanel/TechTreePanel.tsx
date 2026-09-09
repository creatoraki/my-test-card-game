import { useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { TECH_CATEGORIES } from "@/data";
import { useTownStore } from "@/store/townStore";
import { PanelShell } from "@/ui/common/PanelShell";
import type { Rect } from "@/ui/common/panelMorph";
import { TechCategoryRail } from "./TechCategoryRail";
import { TechNodeDetail } from "./TechNodeDetail";
import { TechTreeGraph } from "./TechTreeGraph";
import s from "./TechTreePanel.module.css";

export const TECH_TREE_ACCENT = "#67e2d0";

const TECH_TREE_THEME = {
  "--asm-frame": TECH_TREE_ACCENT,
  "--asm-glow": TECH_TREE_ACCENT,
  "--asm-select": "#c7fff3",
  "--asm-cyan": "#9cf4e5",
  "--asm-line": "#67e2d044",
  "--asm-ink": "#e8fffb",
  "--asm-ink-dim": "#9bc9c4",
  "--asm-panel-bg": "#081816f5",
  "--asm-panel-filter": "blur(10px) saturate(110%) brightness(0.78)",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

export interface TechTreePanelMorph {
  ref: Ref<HTMLElement>;
  rect: Rect;
  ready: boolean;
  seed?: ReactNode;
  seedLabel?: string;
}

interface Props {
  closing: boolean;
  onClose: () => void;
  morph: TechTreePanelMorph;
}

export function TechTreePanel({ closing, onClose, morph }: Props) {
  const techTree = useTownStore((state) => state.techTree);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const researchTech = useTownStore((state) => state.researchTech);
  const [categoryId, setCategoryId] = useState(TECH_CATEGORIES[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const totalLevel = Object.values(techTree.levels).reduce((sum, level) => sum + Math.max(0, level), 0);

  const selectCategory = (nextCategoryId: string) => {
    setCategoryId(nextCategoryId);
    setSelectedId(null);
  };

  return (
    <PanelShell
      accent={TECH_TREE_ACCENT}
      title="科技树"
      status={`已研究 ${totalLevel} 级 · 余额 ${loot.toLocaleString()}`}
      closeLabel="关闭科技树"
      closing={closing}
      onClose={onClose}
      themeStyle={TECH_TREE_THEME}
      morph={morph}
    >
      <div className={s.body}>
        <TechCategoryRail
          categories={TECH_CATEGORIES}
          levels={techTree.levels}
          selectedId={categoryId}
          onSelect={selectCategory}
        />
        <TechTreeGraph
          categoryId={categoryId}
          levels={techTree.levels}
          loot={loot}
          storage={storage}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <TechNodeDetail
          categoryId={categoryId}
          selectedId={selectedId}
          levels={techTree.levels}
          loot={loot}
          storage={storage}
          onResearch={researchTech}
        />
      </div>
    </PanelShell>
  );
}
