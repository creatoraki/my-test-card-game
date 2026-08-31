// 待拾取模组的「装载 / 拾取」接线 —— 战利品盘与探索拾取框各接一次。
//
// 两处的拾取动作本身各不相同(战利品盘有飞行动画、拾取框有背包满提示), 所以拾取由调用方传进来;
// 本 hook 只负责: 判断这件东西是不是模组 → 给格子挂上两个悬浮按钮 → 拉起装配弹窗。

import { useCallback, useState, type ReactNode } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { ModuleSlotActions } from "./ModuleSlotActions";
import { ModuleInstallDialog } from "./ModuleInstallDialog";

interface Options {
  /** 「拾取」时执行的原有拾取动作。 */
  onTake: (stack: ItemStack) => void;
}

export interface LootModuleActions {
  /** 这件东西是不是模组。 */
  isModule: (stack: ItemStack) => boolean;
  /** 点击一个物品格时调用。是模组 ⇒ 返回 true(整格点击不做事, 一切走悬浮按钮); 否则返回 false。 */
  handleClick: (stack: ItemStack) => boolean;
  /** 渲染格子上的悬浮按钮; 非模组返回 null。放在格子包裹层(position: relative)里。 */
  renderActions: (stack: ItemStack) => ReactNode;
  /** 装配弹窗的挂载点, 放在组件树任意位置即可(内部走 portal)。 */
  overlay: ReactNode;
}

export function useLootModuleActions({ onTake }: Options): LootModuleActions {
  const [installing, setInstalling] = useState<ItemStack | null>(null);

  const isModule = useCallback(
    (stack: ItemStack) => getItemDef(stack.itemId).category === "module",
    [],
  );

  const handleClick = useCallback((stack: ItemStack) => isModule(stack), [isModule]);

  const renderActions = useCallback(
    (stack: ItemStack) =>
      isModule(stack) ? (
        <ModuleSlotActions
          onInstall={() => setInstalling(stack)}
          onTake={() => onTake(stack)}
        />
      ) : null,
    [isModule, onTake],
  );

  const overlay = installing ? (
    <ModuleInstallDialog stack={installing} onClose={() => setInstalling(null)} />
  ) : null;

  return { isModule, handleClick, renderActions, overlay };
}
