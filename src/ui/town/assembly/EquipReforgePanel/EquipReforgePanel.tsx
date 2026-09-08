import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import type { EquipTarget } from "@/store/equipCraftSlice";
import { useTownStore } from "@/store/townStore";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipDirection,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { HudPanelShell, HUD_TONE_BLUE } from "@/ui/common/HudPanelShell";
import { buildEquipTargets, equipStackOf, equipTargetKey } from "../EquipTargetList";
import { ReforgeBoard } from "./parts/ReforgeBoard";
import { useReforgeView } from "./reforgeView";

interface Props {
  closing?: boolean;
  onClose: () => void;
  morph: {
    ref: React.Ref<HTMLElement>;
    rect: import("@/ui/common/panelMorph").Rect;
    ready: boolean;
    seed?: React.ReactNode;
    seedLabel?: string;
  };
}

export function EquipReforgePanel({ closing = false, onClose, morph }: Props) {
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const pending = useTownStore((state) => state.pendingReforge);
  const rollReforge = useTownStore((state) => state.rollReforge);
  const applyReforge = useTownStore((state) => state.applyReforge);
  const [selected, setSelected] = useState<EquipTarget | null>(null);
  const [equipTab, setEquipTab] = useState<import("@/ui/common/item/itemFilters").EquipTab>("all");
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);

  const sourceEntries = useMemo(() => buildEquipTargets(storage, characters), [characters, storage]);
  const entries = useMemo(
    () => sourceEntries
      .filter((entry) => getItemDef(entry.stack.itemId).affinityRollable)
      .map((entry) => ({
        key: equipTargetKey(entry.target),
        stack: entry.stack,
        ownerName: entry.ownerName,
      })),
    [sourceEntries],
  );
  const keyMap = useMemo<Map<string, EquipTarget>>(
    () => new Map(
      sourceEntries
        .filter((entry) => getItemDef(entry.stack.itemId).affinityRollable)
        .map((entry): [string, EquipTarget] => [equipTargetKey(entry.target), entry.target]),
    ),
    [sourceEntries],
  );

  const target = pending?.target ?? selected;
  const current = equipStackOf(storage, characters, target);
  const view = useReforgeView(current, storage);
  const selectedKey = pending
    ? equipTargetKey(pending.target)
    : selected
      ? equipTargetKey(selected)
      : null;

  const showTooltip = (element: HTMLElement, stack: ItemStack, direction?: TooltipDirection) => {
    setHovered({ stack, point: tooltipPointFromElement(element, direction) });
  };

  return (
    <>
      <HudPanelShell
        tone={HUD_TONE_BLUE}
        closing={closing}
        onClose={onClose}
        label="羁绊重铸面板"
        morph={morph}
      >
        <ReforgeBoard
          entries={entries}
          equipTab={equipTab}
          onEquipTab={setEquipTab}
          selectedKey={selectedKey}
          onSelect={(key) => {
            if (pending) return;
            const next = keyMap.get(key);
            if (next) setSelected(next);
          }}
          current={current}
          currentDef={view.def}
          check={view.check}
          pending={pending}
          notice={pending
            ? "请选择要保留的羁绊，放弃新羁绊不会返还材料。"
            : view.notice}
          canRoll={view.canRoll}
          onRoll={() => target && rollReforge(target)}
          onApply={applyReforge}
          onShowTooltip={showTooltip}
          onHideTooltip={() => setHovered(null)}
        />
      </HudPanelShell>
      {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} />}
    </>
  );
}
