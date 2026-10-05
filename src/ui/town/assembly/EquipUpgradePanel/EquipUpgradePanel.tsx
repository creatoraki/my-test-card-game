import { useMemo, useState } from "react";
import type { EquipRoll, ItemDef, ItemStack } from "@/items/types";
import { useTownStore } from "@/store/town/townStore";
import type { EquipTarget } from "@/store/townSlices/equipCraftSlice";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipDirection,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { buildEquipTargets, equipStackOf, equipTargetKey } from "../EquipTargetList";
import { EquipUpgradeBoard, type PickEntry } from "./parts";
import { EquipUpgradeReveal } from "./EquipUpgradeReveal";
import { useUpgradeView } from "./upgradeView";

interface UpgradeResult {
  fromDef: ItemDef;
  toDef: ItemDef;
  before: EquipRoll;
  after: EquipRoll;
}

export function EquipUpgradePanel() {
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const loot = useTownStore((state) => state.loot);
  const upgradeEquip = useTownStore((state) => state.upgradeEquip);
  const [selected, setSelected] = useState<EquipTarget | null>(null);
  const [equipTab, setEquipTab] = useState<import("@/ui/common/item/shared/itemFilters").EquipTab>("all");
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);
  const [result, setResult] = useState<UpgradeResult | null>(null);

  const entries = useMemo<PickEntry[]>(
    () => buildEquipTargets(storage, characters).map((entry) => ({
      key: equipTargetKey(entry.target),
      stack: entry.stack,
      ownerName: entry.ownerName,
      ownerId: entry.target.kind === "equipped" ? entry.target.charId : undefined,
    })),
    [characters, storage],
  );
  const keyMap = useMemo(
    () => new Map(buildEquipTargets(storage, characters).map((entry) => [equipTargetKey(entry.target), entry.target])),
    [characters, storage],
  );
  const selectedKey = selected ? equipTargetKey(selected) : null;
  const current = equipStackOf(storage, characters, selected);
  const view = useUpgradeView(current, loot, storage);

  const showTooltip = (element: HTMLElement, stack: ItemStack, direction?: TooltipDirection) => {
    setHovered({ stack, point: tooltipPointFromElement(element, direction) });
  };

  const onUpgrade = () => {
    if (!selected || !current?.roll || !view.currentDef || !view.nextDef) return;
    const before = current.roll;
    const fromDef = view.currentDef;
    const toDef = view.nextDef;
    upgradeEquip(selected);
    const nextState = useTownStore.getState();
    const after = equipStackOf(nextState.storage, nextState.characters, selected);
    if (!after?.roll || after.itemId !== toDef.id) return;
    setResult({ fromDef, toDef, before, after: after.roll });
  };

  return (
    <>
      <EquipUpgradeBoard
        entries={entries}
        equipTab={equipTab}
        onEquipTab={setEquipTab}
        selectedKey={selectedKey}
        onSelect={(key) => {
          const target = keyMap.get(key);
          if (!target) return;
          setSelected(target);
        }}
        current={current}
        currentDef={view.currentDef}
        affinityId={current?.affinity ?? view.currentDef?.affinity}
        nextDef={view.nextDef}
        check={view.check}
        loot={loot}
        preview={view.preview}
        notice={view.notice}
        canUpgrade={view.canUpgrade}
        onUpgrade={onUpgrade}
        onShowTooltip={showTooltip}
        onHideTooltip={() => setHovered(null)}
      />
      {result && <EquipUpgradeReveal {...result} onClose={() => setResult(null)} />}
      {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} />}
    </>
  );
}
