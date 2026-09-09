import { useMemo, type CSSProperties, type ReactNode } from "react";
import { getItemDef, recipesOfCharacter } from "@/data";
import { CLOSE_MS, usePanelMorph, type Rect } from "@/ui/common/panelMorph";
import { useTownStore } from "@/store/townStore";
import { useFacilityPanelExit } from "@/ui/town/facilityExit";
import { DrawerEntry } from "@/ui/town/drawerEntry";
import { CraftPanel, CRAFT_ACCENT } from "../CraftPanel";
import { ModuleAssemblyPanel, type ModulePanelMorph } from "./ModuleAssemblyPanel";
import { TechTreePanel, TECH_TREE_ACCENT } from "../TechTreePanel";
import { AssemblyIcon, CraftIcon, TechTreeIcon } from "./icons";

export const MODULE_PANEL_RECT: Rect = { x: 160, y: 80, w: 1600, h: 920 };

type ModulePanelId = "assembly" | "craft" | "tech";

const MODULE_PANEL_RECTS: Record<ModulePanelId, Rect> = {
  assembly: MODULE_PANEL_RECT,
  craft: MODULE_PANEL_RECT,
  tech: MODULE_PANEL_RECT,
};

export interface ModulePanels {
  entryVars: CSSProperties;
  entries: ReactNode;
  panels: ReactNode;
}

export function useModulePanels(): ModulePanels {
  const storage = useTownStore((state) => state.storage);
  const awakened = useTownStore((state) => state.awakened);
  const techTree = useTownStore((state) => state.techTree);
  const moduleStacks = useMemo(
    () => storage.filter((stack) => getItemDef(stack.itemId).category === "module"),
    [storage],
  );
  const craftableCount = useMemo(
    () => new Set(awakened.flatMap((id) => recipesOfCharacter(id).map((recipe) => recipe.itemId))).size,
    [awakened],
  );
  const researchedLevel = useMemo(
    () => Object.values(techTree.levels).reduce((sum, level) => sum + Math.max(0, level), 0),
    [techTree.levels],
  );
  const morph = usePanelMorph<ModulePanelId>({
    rects: MODULE_PANEL_RECTS,
  });

  useFacilityPanelExit(() => {
    if (!morph.panel) return 0;
    morph.closePanel();
    return CLOSE_MS;
  });

  const hidden = (id: ModulePanelId) => morph.hiddenEntry === id && morph.phase !== "closing";
  const revealing = (id: ModulePanelId) => morph.phase === "closing" && morph.hiddenEntry === id;

  const entries = (
    <>
      <DrawerEntry
        icon={<AssemblyIcon />}
        name="模组装配"
        desc={`${moduleStacks.length} 件模组可用`}
        entryId="assembly"
        hidden={hidden("assembly")}
        revealing={revealing("assembly")}
        onClick={(event) => morph.openPanel("assembly", event.currentTarget)}
      />
      <DrawerEntry
        icon={<CraftIcon />}
        name="模组制造"
        desc={`${craftableCount} 种模组可造`}
        entryId="craft"
        glow={CRAFT_ACCENT}
        hidden={hidden("craft")}
        revealing={revealing("craft")}
        onClick={(event) => morph.openPanel("craft", event.currentTarget)}
      />
      <DrawerEntry
        icon={<TechTreeIcon />}
        name="科技树"
        desc={`已研究 ${researchedLevel} 级`}
        entryId="tech"
        glow={TECH_TREE_ACCENT}
        hidden={hidden("tech")}
        revealing={revealing("tech")}
        onClick={(event) => morph.openPanel("tech", event.currentTarget)}
      />
    </>
  );

  const moduleMorph = (seed: ReactNode, seedLabel: string): ModulePanelMorph => ({
    ref: morph.panelRef,
    rect: MODULE_PANEL_RECT,
    ready: morph.ready,
    seed,
    seedLabel,
  });

  const panels = (
    <>
      {morph.panel === "assembly" && (
        <ModuleAssemblyPanel
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          morph={moduleMorph(<AssemblyIcon />, "模组装配")}
        />
      )}
      {morph.panel === "craft" && (
        <CraftPanel
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          morph={moduleMorph(<CraftIcon />, "模组制造")}
        />
      )}
      {morph.panel === "tech" && (
        <TechTreePanel
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          morph={moduleMorph(<TechTreeIcon />, "科技树")}
        />
      )}
    </>
  );

  return { entryVars: morph.entryVars, entries, panels };
}
