// 「02 制造清单」面板: 当前角色能造的模组, 两列配方卡; 面板底部压一层标语与徽标水印。
import type { CraftCheck, ModuleRecipe } from "@/data";
import { TerminalPanel } from "../TerminalPanel";
import { RecipeCard } from "./RecipeCard";
import s from "./CraftRecipeGrid.module.css";

interface Props {
  recipes: ModuleRecipe[];
  /** 与 recipes 一一对应的可行性判定, 由面板统一算好传进来。 */
  checks: Record<string, CraftCheck>;
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
  className?: string;
}

export function CraftRecipeGrid({ recipes, checks, selectedItemId, onSelect, className }: Props) {
  return (
    <TerminalPanel
      index="02"
      title="制造清单"
      deco="MODULE LIST"
      extra={`${recipes.length} 种模组`}
      ariaLabel="可制造模组"
      className={className}
      bodyClassName={s.body}
    >
      <div className={s.watermark} aria-hidden="true">
        <p className={s.motto}>
          <span className={s.mottoMark}>⊼</span>
          CUSTOM MODULES
          <br />
          FOR A STRONGER
          <br />
          TOMORROW.
        </p>
        <svg className={s.emblem} viewBox="0 0 300 270" fill="none">
          <path d="M150 8 292 262H8Z" fill="#ffffff05" stroke="#ffffff0f" strokeWidth="3" />
          <path d="M150 62 246 234H54Z" fill="#0000004d" />
          <path d="M150 62 246 234H54Z" stroke="#ffffff0d" strokeWidth="26" strokeLinejoin="bevel" />
          <path d="M122 234 172 146l36 62" stroke="#ffffff12" strokeWidth="22" strokeLinejoin="bevel" />
        </svg>
      </div>
      {recipes.length ? (
        <div className={s.list} role="list">
          {recipes.map((recipe, index) => (
            <div key={recipe.itemId} role="listitem">
              <RecipeCard
                itemId={recipe.itemId}
                order={index + 1}
                check={checks[recipe.itemId]}
                selected={recipe.itemId === selectedItemId}
                onSelect={() => onSelect(recipe.itemId)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className={s.empty}>该角色暂无可制造的模组</p>
      )}
    </TerminalPanel>
  );
}
