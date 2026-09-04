import { useState } from "react";
import { getItemDef, nextEquipDef, upgradeCheck } from "@/data";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import type { EquipTarget } from "@/store/equipCraftSlice";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { EventPanelButton } from "@/ui/common/EventPanel";
import { EquipCostRack } from "../EquipCostRack";
import { EquipTargetList, equipStackOf } from "../EquipTargetList";
import s from "./EquipUpgradePanel.module.css";

export function EquipUpgradePanel() {
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const loot = useTownStore((state) => state.loot);
  const upgradeEquip = useTownStore((state) => state.upgradeEquip);
  const [selected, setSelected] = useState<EquipTarget | null>(null);
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);

  const current = equipStackOf(storage, characters, selected);
  const currentDef = current ? getItemDef(current.itemId) : null;
  const nextDef = currentDef?.category === "equipment" ? nextEquipDef(currentDef) : null;
  const check = nextDef ? upgradeCheck(nextDef, loot, storage) : null;
  const nextPreview = current && nextDef ? { ...current, itemId: nextDef.id } : null;
  const canUpgrade = Boolean(current?.roll && nextDef?.model && check?.ok);

  const showTooltip = (element: HTMLElement, stack: ItemStack) => {
    setHovered({ stack, point: tooltipPointFromElement(element) });
  };

  let notice = "选择一件装备查看升阶预览。";
  if (current && !current.roll) notice = "这件装备没有可用词条模型，无法升阶。";
  else if (current && !nextDef) notice = "这件装备已达到本族最高阶。";
  else if (nextDef) notice = `升阶后：${nextDef.name}，原有词条会保留并增加新的预算。`;

  return (
    <>
      <div className={s.body}>
        <EquipTargetList
          storage={storage}
          characters={characters}
          selected={selected}
          onSelect={setSelected}
          onShowTooltip={showTooltip}
          onHideTooltip={() => setHovered(null)}
        />
        <div className={s.main}>
          <div className={s.comparison}>
            <div className={s.detailColumn}>
              <span className={s.label}>当前装备</span>
              <ItemDetail
                stack={current}
                placeholder="从左侧选择一件装备。"
                className={s.detail}
              />
            </div>
            <div className={s.detailColumn}>
              <span className={s.label}>升阶预览</span>
              <ItemDetail
                stack={nextPreview}
                placeholder="选择装备后显示下一阶。"
                className={s.detail}
              />
            </div>
          </div>
          <p className={s.notice}>{notice}</p>
          <EquipCostRack
            check={check}
            onShowTooltip={showTooltip}
            onHideTooltip={() => setHovered(null)}
          />
          <div className={s.footer}>
            <EventPanelButton
              tone="primary"
              disabled={!canUpgrade}
              onClick={() => selected && upgradeEquip(selected)}
              aria-label="升阶选中的装备"
            >
              升阶
            </EventPanelButton>
          </div>
        </div>
      </div>
      {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} />}
    </>
  );
}