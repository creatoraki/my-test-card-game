// 装备升阶面板 demo —— HudFrame 外框内的三列: 装备选择 / 消耗 / 升阶收益。
// 目标是替换 town/storage/EquipUpgradePanel。本页用假数据(demoData.ts), 不接存档。

import { useMemo, useState } from "react";
import type { ItemStack } from "@/items/types";
import type { EquipTab } from "@/ui/common/item/itemFilters";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipDirection,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { HudFrame } from "@/ui/common/HudFrame";
import { EquipUpgradeBoard, type PickEntry } from "@/ui/town/storage/EquipUpgradePanel/parts";
import { useUpgradeView } from "@/ui/town/storage/EquipUpgradePanel/upgradeView";
import { DEMO_EQUIPS, DEMO_LOOT, DEMO_STORAGE } from "./demoData";
import { applyDemoUpgrade, type DemoState } from "./demoUpgrade";
import s from "./OpusHudFrameDemo.module.css";

const INITIAL: DemoState = { equips: DEMO_EQUIPS, storage: DEMO_STORAGE, loot: DEMO_LOOT };

export function OpusHudFrameDemo() {
  const [state, setState] = useState<DemoState>(INITIAL);
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selectedUid, setSelectedUid] = useState<string | null>(DEMO_EQUIPS[0]?.stack.uid ?? null);
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const entries = useMemo<PickEntry[]>(
    () => state.equips.map((entry) => ({ key: entry.stack.uid, ...entry })),
    [state.equips],
  );
  const current = entries.find((entry) => entry.key === selectedUid)?.stack ?? null;
  const view = useUpgradeView(current, state.loot, state.storage);

  const showTooltip = (element: HTMLElement, stack: ItemStack, direction?: TooltipDirection) => {
    setHovered({ stack, point: tooltipPointFromElement(element, direction) });
  };

  const onUpgrade = () => {
    if (!selectedUid) return;
    const result = applyDemoUpgrade(state, selectedUid);
    if (!result) return;
    setState(result.state);
    setFlash(result.message);
  };

  return (
    <div className={s.root}>
      <div className={s.backdrop} aria-hidden />

      <header className={s.header}>
        <p className={s.kicker}>OPUS / 装备升阶</p>
        <h2>升阶终端</h2>
        <p className={s.headerNote}>
          左列挑装备，中列看这一阶要花什么，右列看升阶后落点并落锤。
          数据为 demo 假数据，升阶只改本页状态，不写存档。
        </p>
      </header>

      <div className={s.stage}>
        <HudFrame className={s.frame} label="装备升阶面板">
          <EquipUpgradeBoard
            entries={entries}
            equipTab={equipTab}
            onEquipTab={setEquipTab}
            selectedKey={selectedUid}
            onSelect={(key) => {
              setSelectedUid(key);
              setFlash(null);
            }}
            current={current}
            currentDef={view.currentDef}
            nextDef={view.nextDef}
            check={view.check}
            loot={state.loot}
            preview={view.preview}
            notice={view.notice}
            canUpgrade={view.canUpgrade}
            onUpgrade={onUpgrade}
            onShowTooltip={showTooltip}
            onHideTooltip={() => setHovered(null)}
          />
        </HudFrame>

        {flash && (
          <p className={s.flash} role="status">
            {flash}
          </p>
        )}
      </div>

      {/* 浮层挂在 HudFrame 外面 —— 框内的毛玻璃有 clip-path, 放进去会被裁掉。 */}
      {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} />}
    </div>
  );
}
