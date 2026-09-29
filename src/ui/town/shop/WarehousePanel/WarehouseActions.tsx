// 仓库详情栏底部的操作区 —— 模组「装载」、模组箱「拆箱」。其余物品没有仓库内操作, 整块不渲染。
// ⚠ 只画按钮, 不持有弹窗状态: 拆箱后箱子会从仓库消失、选中项随之切走, 状态放这里会跟着卸载。

import { getCardModule, getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { ItemActionButton } from "@/ui/common/item/ItemActionCard";
import s from "./WarehouseActions.module.css";

interface Props {
  stack: ItemStack;
  onInstall: (stack: ItemStack) => void;
  onOpenCrate: (stack: ItemStack) => void;
}

export function WarehouseActions({ stack, onInstall, onOpenCrate }: Props) {
  const def = getItemDef(stack.itemId);
  const isModule = def.category === "module" && Boolean(getCardModule(stack.itemId));
  const isCrate = def.use?.kind === "openModuleCrate";
  if (!isModule && !isCrate) return null;

  return (
    <div className={s.actions}>
      {isModule ? (
        <ItemActionButton block label="装载" tone="module" icon="install" onClick={() => onInstall(stack)} />
      ) : (
        <ItemActionButton block label="拆箱" tone="module" icon="open" onClick={() => onOpenCrate(stack)} />
      )}
      <p className={s.note}>
        {isModule
          ? "装到任意已唤醒角色的卡牌上，已装的旧模组会退回仓库。"
          : "随机开出一件通用模组，直接存入仓库。"}
      </p>
    </div>
  );
}
