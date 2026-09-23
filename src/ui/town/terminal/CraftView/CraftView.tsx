// 研究中心「模组制造」页: 01 角色选择 / 02 制造清单 / 03 制造详情(含所需材料)。
// ★ 制造判定来自 data 的 craftCheck, 页面不复制规则。
import { useEffect, useMemo, useState } from "react";
import { craftCheck, getModuleRecipe, recipesOfCharacter, type CraftCheck } from "@/data";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/town/townStore";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { AssemblyCharacterStage } from "../AssemblyCharacterStage";
import { CraftBench } from "../CraftBench";
import { CraftRecipeGrid } from "../CraftRecipeGrid";
import s from "./CraftView.module.css";

interface HoveredItem {
  stack: ItemStack;
  point: TooltipPoint;
}

export function CraftView() {
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
        <CraftBench
          recipe={recipe}
          check={check}
          exp={exp}
          onCraft={() => recipe && craftModule(charId, recipe.itemId)}
          onShowTooltip={showTooltip}
          onHideTooltip={() => setHoveredItem(null)}
        />
      </div>
      {hoveredItem && <ItemTooltip stack={hoveredItem.stack} point={hoveredItem.point} />}
    </>
  );
}
