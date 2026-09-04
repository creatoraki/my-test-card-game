// 装备升阶面板 demo —— HudFrame 外框内的三列: 装备选择 / 消耗 / 升阶收益。
// 目标是替换 town/storage/EquipUpgradePanel。本页用假数据(demoData.ts), 不接存档。

import { useMemo, useState } from "react";
import { getItemDef, nextEquipDef, upgradeCheck } from "@/data";
import type { ItemStack } from "@/items/types";
import type { EquipTab } from "@/ui/common/item/itemFilters";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipDirection,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { HudFrame } from "../HudFrame";
import { DEMO_EQUIPS, DEMO_LOOT, DEMO_STORAGE } from "./demoData";
import { applyDemoUpgrade, type DemoState } from "./demoUpgrade";
import { upgradeRangePreview } from "./upgradeRange";
import { EquipForgeColumn } from "./parts/EquipForgeColumn";
import { EquipGainColumn } from "./parts/EquipGainColumn";
import { EquipPickColumn } from "./parts/EquipPickColumn";
import s from "./OpusHudFrameDemo.module.css";

const INITIAL: DemoState = { equips: DEMO_EQUIPS, storage: DEMO_STORAGE, loot: DEMO_LOOT };

export function OpusHudFrameDemo() {
  const [state, setState] = useState<DemoState>(INITIAL);
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selectedUid, setSelectedUid] = useState<string | null>(DEMO_EQUIPS[0]?.stack.uid ?? null);
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const current = state.equips.find((entry) => entry.stack.uid === selectedUid)?.stack ?? null;
  const currentDef = current ? getItemDef(current.itemId) : null;
  const nextDef = currentDef?.category === "equipment" ? nextEquipDef(currentDef) : null;
  const check = nextDef ? upgradeCheck(nextDef, state.loot, state.storage) : null;
  const preview = useMemo(
    () => (nextDef && current?.roll ? upgradeRangePreview(nextDef, current.roll) : null),
    [current?.roll, nextDef],
  );
  const canUpgrade = Boolean(current?.roll && nextDef?.model && check?.ok);

  let notice = "选择一件装备查看升阶预览。";
  if (current && !current.roll) notice = "这件装备没有可用词条模型，无法升阶。";
  else if (current && !nextDef) notice = "这件装备已达到本族最高阶。";
  else if (nextDef) notice = "升阶保留原有词条，并在此基础上追加新的模型值预算。";

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
          <div className={s.layout}>
            <EquipPickColumn
              equips={state.equips}
              equipTab={equipTab}
              onEquipTab={setEquipTab}
              selectedUid={selectedUid}
              onSelect={(uid) => {
                setSelectedUid(uid);
                setFlash(null);
              }}
              onShowTooltip={showTooltip}
              onHideTooltip={() => setHovered(null)}
            />

            <span className={s.divider} aria-hidden />

            <EquipForgeColumn
              stack={current}
              def={currentDef}
              check={check}
              loot={state.loot}
              onShowTooltip={showTooltip}
              onHideTooltip={() => setHovered(null)}
            />

            <span className={s.divider} aria-hidden />

            <EquipGainColumn
              preview={preview}
              emptyText={notice}
              def={currentDef}
              nextDef={nextDef}
              canUpgrade={canUpgrade}
              onUpgrade={onUpgrade}
            />
          </div>
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
