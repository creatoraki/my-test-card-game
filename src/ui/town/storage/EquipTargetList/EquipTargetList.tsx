import { useMemo, useState } from "react";
import type { CharacterState } from "@/store/townStore";
import type { EquipTarget } from "@/store/equipCraftSlice";
import { getCharacter, getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs";
import { matchTab, type EquipTab } from "@/ui/common/item/itemFilters";
import { cx } from "@/ui/common/cx";
import s from "./EquipTargetList.module.css";

export interface EquipTargetEntry {
  target: EquipTarget;
  stack: ItemStack;
  ownerName?: string;
}

export function equipTargetKey(target: EquipTarget): string {
  return target.kind === "storage"
    ? `storage:${target.uid}`
    : `equipped:${target.charId}:${target.slot}`;
}

export function equipStackOf(
  storage: ItemStack[],
  characters: Record<string, CharacterState>,
  target: EquipTarget | null,
): ItemStack | null {
  if (!target) return null;
  if (target.kind === "storage") return storage.find((stack) => stack.uid === target.uid) ?? null;
  return characters[target.charId]?.equipped?.[target.slot] ?? null;
}

export function buildEquipTargets(
  storage: ItemStack[],
  characters: Record<string, CharacterState>,
): EquipTargetEntry[] {
  const stored = storage
    .filter((stack) => getItemDef(stack.itemId).category === "equipment")
    .map((stack) => ({ target: { kind: "storage", uid: stack.uid } as EquipTarget, stack }));
  const equipped = Object.values(characters).flatMap((character) =>
    (["weapon", "armor", "trinket"] as const).flatMap((slot) => {
      const stack = character.equipped?.[slot];
      if (!stack) return [];
      return [{
        target: { kind: "equipped", charId: character.charId, slot } as EquipTarget,
        stack,
        ownerName: getCharacter(character.charId).name,
      }];
    }),
  );
  return [...stored, ...equipped];
}

interface Props {
  storage: ItemStack[];
  characters: Record<string, CharacterState>;
  selected: EquipTarget | null;
  onSelect: (target: EquipTarget) => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

export function EquipTargetList({
  storage,
  characters,
  selected,
  onSelect,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const entries = useMemo(() => buildEquipTargets(storage, characters), [characters, storage]);
  const shown = entries.filter((entry) => matchTab(entry.stack, "equipment", equipTab));
  const selectedKey = selected ? equipTargetKey(selected) : null;

  return (
    <section className={s.list} aria-label="装备选择">
      <div className={s.heading}>
        <span className={s.kicker}>装备选择</span>
        <span className={s.count}>{entries.length} 件</span>
      </div>
      <ItemTabs
        stacks={entries.map((entry) => entry.stack)}
        tab="equipment"
        equipTab={equipTab}
        visibleTabs={["equipment"]}
        onTab={() => setEquipTab("all")}
        onEquipTab={setEquipTab}
        className={s.tabs}
      />
      {shown.length ? (
        <div className={s.grid}>
          {shown.map((entry) => {
            const key = equipTargetKey(entry.target);
            return (
              <div
                key={key}
                className={cx(s.option, selectedKey === key && s.selected)}
                onPointerEnter={(event) => onShowTooltip(event.currentTarget, entry.stack)}
                onPointerLeave={onHideTooltip}
                onFocus={(event) => onShowTooltip(event.currentTarget, entry.stack)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHideTooltip();
                }}
              >
                <ItemSlot
                  stack={entry.stack}
                  showName={false}
                  selected={selectedKey === key}
                  onClick={() => onSelect(entry.target)}
                  aria-label={`${getItemDef(entry.stack.itemId).name}${entry.ownerName ? `，${entry.ownerName}已穿戴` : "，仓库"}`}
                />
                {entry.ownerName && <span className={s.owner}>{entry.ownerName}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={s.empty}>没有符合筛选条件的装备。</p>
      )}
    </section>
  );
}