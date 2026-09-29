// 待拾取物品的遮罩按钮接线 —— 战利品盘、探索拾取浮层、事件面板掉落各接一次。
//
// 几处的拾取动作本身各不相同(战利品盘有脉冲反馈、拾取浮层有飞行动画与背包满提示),
// 所以拾取由调用方传进来; 本 hook 只负责: 给出这件东西的遮罩按钮 → 模组额外拉起装配弹窗。
//   · 模组: 装载(改造卡牌, 不占背包格) + 拾取
//   · 其他: 拾取

import { useCallback, useState, type ReactNode } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import type { SlotAction } from "@/ui/common/item/ItemActionMask";
import { ModuleInstallDialog } from "./ModuleInstallDialog";

interface Options {
  /** 「拾取」时执行的原有拾取动作。 */
  onTake: (stack: ItemStack) => void;
}

export interface LootSlotActions {
  /** 这件东西是不是模组(新手引导锚点等用)。 */
  isModule: (stack: ItemStack) => boolean;
  /** 这一格交互模式下的遮罩按钮。 */
  actionsFor: (stack: ItemStack) => SlotAction[];
  /** 装配弹窗的挂载点, 放在组件树任意位置即可(内部走 portal)。 */
  overlay: ReactNode;
}

export function useLootSlotActions({ onTake }: Options): LootSlotActions {
  const [installing, setInstalling] = useState<ItemStack | null>(null);

  const isModule = useCallback(
    (stack: ItemStack) => getItemDef(stack.itemId).category === "module",
    [],
  );

  const actionsFor = useCallback(
    (stack: ItemStack): SlotAction[] => {
      const take: SlotAction = { key: "take", label: "拾取", tone: "primary", onSelect: () => onTake(stack) };
      if (!isModule(stack)) return [take];
      return [{ key: "install", label: "装载", tone: "module", onSelect: () => setInstalling(stack) }, take];
    },
    [isModule, onTake],
  );

  const overlay = installing ? (
    <ModuleInstallDialog stack={installing} onClose={() => setInstalling(null)} />
  ) : null;

  return { isModule, actionsFor, overlay };
}
