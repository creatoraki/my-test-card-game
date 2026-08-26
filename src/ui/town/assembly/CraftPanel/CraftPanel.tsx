import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { craftCheck, getModuleRecipe, recipesOfCharacter, type CraftCheck } from "@/data";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { AssemblyCharacterStage } from "../AssemblyCharacterStage";
import { PanelShell } from "@/ui/common/PanelShell";
import { CraftBench } from "../CraftBench";
import { CraftMaterialRack } from "../CraftMaterialRack";
import { CraftRecipeGrid } from "../CraftRecipeGrid";
import s from "./CraftPanel.module.css";

/** 制造弹窗的熔炉琥珀配色。★ 只覆盖变量, 外壳与各子组件的规则一条都不必复制。 */
export const CRAFT_ACCENT = "#ff9d4d";
const CRAFT_THEME = {
  "--asm-frame": CRAFT_ACCENT,
  "--asm-glow": CRAFT_ACCENT,
  "--asm-select": "#ffd08a",
  "--asm-cyan": "#ffb35c",
  "--asm-line": "#ffb0572e",
  "--asm-ink": "#fdf1e6",
  "--asm-ink-dim": "#b39a86",
} as CSSProperties;

interface Props {
  closing: boolean;
  onClose: () => void;
}

interface HoveredItem {
  stack: ItemStack;
  point: TooltipPoint;
}

export function CraftPanel({ closing, onClose }: Props) {
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const awakened = useTownStore((state) => state.awakened);
  const craftModule = useTownStore((state) => state.craftModule);
  const [charId, setCharId] = useState(awakened[0] ?? "");
  const [recipeItemId, setRecipeItemId] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);

  useEffect(() => {
    if (awakened.length && !awakened.includes(charId)) setCharId(awakened[0]);
  }, [awakened, charId]);

  const currentCharacter = characters[charId] ?? characters[awakened[0] ?? ""];
  const exp = currentCharacter?.exp ?? 0;
  const recipes = useMemo(() => recipesOfCharacter(charId), [charId]);
  const checks = useMemo(() => {
    const out: Record<string, CraftCheck> = {};
    for (const recipe of recipes) out[recipe.itemId] = craftCheck(recipe, exp, storage);
    return out;
  }, [exp, recipes, storage]);

  // 换角色后原选中的配方多半不属于新角色, 这里回落到第一条。
  useEffect(() => {
    if (!recipes.some((recipe) => recipe.itemId === recipeItemId)) {
      setRecipeItemId(recipes[0]?.itemId ?? null);
    }
  }, [recipeItemId, recipes]);

  const recipe = recipeItemId ? (getModuleRecipe(charId, recipeItemId) ?? null) : null;
  const check = recipe ? (checks[recipe.itemId] ?? null) : null;

  const showTooltip = (element: HTMLElement, stack: ItemStack) => {
    setHoveredItem({ stack, point: tooltipPointFromElement(element) });
  };

  return (
    <>
      <PanelShell
        accent={CRAFT_ACCENT}
        title="模组制造"
        status={`可制造 ${recipes.length} 种 · 经验 ${exp}`}
        closeLabel="关闭模组制造"
        closing={closing}
        onClose={onClose}
        themeStyle={CRAFT_THEME}
      >
        <div className={s.body}>
          <AssemblyCharacterStage
            awakened={awakened}
            selected={charId}
            onSelect={(id) => {
              setCharId(id);
              setHoveredItem(null);
            }}
          />
          <CraftRecipeGrid
            recipes={recipes}
            checks={checks}
            selectedItemId={recipe?.itemId ?? null}
            onSelect={setRecipeItemId}
          />
          <div className={s.rightColumn}>
            <CraftBench
              recipe={recipe}
              check={check}
              exp={exp}
              onCraft={() => recipe && craftModule(charId, recipe.itemId)}
              onShowTooltip={showTooltip}
              onHideTooltip={() => setHoveredItem(null)}
            />
            <CraftMaterialRack
              recipes={recipes}
              storage={storage}
              recipe={recipe}
              onShowTooltip={showTooltip}
              onHideTooltip={() => setHoveredItem(null)}
            />
          </div>
        </div>
      </PanelShell>
      {hoveredItem && <ItemTooltip stack={hoveredItem.stack} point={hoveredItem.point} />}
    </>
  );
}
