import { getItemDef, sellPriceOf, type TechTreeState } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import s from "./EndHaulPanel.module.css";

interface Props {
  haul: ItemStack[];
  salvageValue: number;
  wiped: boolean;
  levels: TechTreeState["levels"];
}

export function EndHaulPanel({ haul, salvageValue, wiped, levels }: Props) {
  const itemCount = haul.reduce((total, stack) => total + stack.count, 0);
  // 换金物回城即变现(townStore.depositHaul), 不进仓库 —— 面板照常把它列出来, 只是说明去向。
  const stored = salvageValue
    ? `换金物已自动售出 +${salvageValue} 积分 · 其余存入物资中转仓`
    : "已存入物资中转仓";
  const subtitle = itemCount
    ? `${itemCount} 件 · ${stored}${wiped ? " · 全靠投递口寄回" : ""}`
    : wiped
      ? "本趟物资全部遗失"
      : "本趟没有带回物资";

  return (
    <ItemInventoryPanel
      className={s["end-haul"]}
      stacks={haul}
      rows={4}
      columns={6}
      kicker="远征回收 // 物资终端"
      title="带回据点"
      subtitle={subtitle}
      credits={salvageValue}
      creditsLabel="积分"
      capacityLabel="占用"
      gridLabel="带回据点的物资"
      panelId="end-haul-panel"
      colorMap={EXPLORE_BACKPACK_COLORS}
      renderSelectedInfo={(stack) => {
        if (!stack) {
          return (
            <>
              <span>物资状态</span>
              <span>{wiped ? "遗失：未有物资带回" : "空手而归：本趟没有可存入物资"}</span>
            </>
          );
        }
        const def = getItemDef(stack.itemId);
        const sellPrice = sellPriceOf(def, levels);
        return (
          <>
            <span>物资详情</span>
            <strong>{def.name}</strong>
            <span>
              {stack.count > 1 ? `数量 ${stack.count} · ` : ""}
              {def.category === "scrap" && sellPrice > 0
                ? `已自动售出 · 每件 ${sellPrice} 积分`
                : "不可换金物资"}
            </span>
          </>
        );
      }}
    />
  );
}
