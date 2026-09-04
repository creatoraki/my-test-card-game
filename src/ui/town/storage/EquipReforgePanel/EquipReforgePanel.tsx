import { useState } from "react";
import { getItemDef, reforgeCheck } from "@/data";
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
import s from "./EquipReforgePanel.module.css";

export function EquipReforgePanel() {
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const pending = useTownStore((state) => state.pendingReforge);
  const rollReforge = useTownStore((state) => state.rollReforge);
  const applyReforge = useTownStore((state) => state.applyReforge);
  const [selected, setSelected] = useState<EquipTarget | null>(null);
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);

  const target = pending?.target ?? selected;
  const current = equipStackOf(storage, characters, target);
  const check = reforgeCheck(storage);
  const canRoll = Boolean(selected && current && getItemDef(current.itemId).model && check.ok);
  const showTooltip = (element: HTMLElement, stack: ItemStack) => {
    setHovered({ stack, point: tooltipPointFromElement(element) });
  };

  if (pending) {
    const original = current;
    const next = original ? { ...original, roll: pending.roll } : null;
    return (
      <>
        <div className={s.compareBody}>
          <p className={s.compareNotice}>请选择要保留的词条。重铸材料已经扣除，放弃新词条不会返还。</p>
          <div className={s.compareGrid}>
            <div className={s.detailColumn}>
              <span className={s.label}>原词条</span>
              <ItemDetail stack={original} placeholder="原装备已不在当前目标中。" className={s.detail} />
              <EventPanelButton
                onClick={() => applyReforge(false)}
                aria-label="保留原词条"
              >
                保留这套
              </EventPanelButton>
            </div>
            <div className={s.detailColumn}>
              <span className={s.label}>新词条</span>
              <ItemDetail stack={next} placeholder="新词条候选" className={s.detail} />
              <EventPanelButton
                tone="primary"
                onClick={() => applyReforge(true)}
                aria-label="保留新词条"
              >
                保留这套
              </EventPanelButton>
            </div>
          </div>
        </div>
        {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} />}
      </>
    );
  }

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
          <div className={s.preview}>
            <span className={s.label}>当前装备</span>
            <ItemDetail
              stack={current}
              placeholder="从左侧选择一件装备。"
              className={s.detail}
            />
          </div>
          <p className={s.notice}>
            {current && !getItemDef(current.itemId).model
              ? "这件装备没有随机词条模型，无法重铸。"
              : "重铸会先生成一套新词条，确认后再决定保留哪一套。"}
          </p>
          <EquipCostRack
            check={check}
            onShowTooltip={showTooltip}
            onHideTooltip={() => setHovered(null)}
          />
          <div className={s.footer}>
            <EventPanelButton
              tone="primary"
              disabled={!canRoll}
              onClick={() => selected && rollReforge(selected)}
              aria-label="重铸选中的装备词条"
            >
              重铸
            </EventPanelButton>
          </div>
        </div>
      </div>
      {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} />}
    </>
  );
}