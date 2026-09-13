import { useMemo, useState } from "react";
import {
  difficultyLockReason,
  getMapDifficulty,
  isDifficultyUnlocked,
  makeAidSupplyStacks,
  MAP_DIFFICULTY_IDS,
  mapHasDifficulty,
  type MapDifficulty,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { HoverTooltip } from "@/ui/common/HoverTooltip";
import { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { PanelItemRow } from "./PanelItemRow";
import s from "./MapDifficultyPanel.module.css";

interface Props {
  mapId: string;
  difficulty: MapDifficulty;
  clearedKeys: readonly string[];
  rewards: ItemStack[];
  onSelect: (difficulty: MapDifficulty) => void;
  active: boolean;
}

export function MapDifficultyPanel({
  mapId,
  difficulty,
  clearedKeys,
  rewards,
  onSelect,
  active,
}: Props) {
  const [lockTooltip, setLockTooltip] = useState<{
    name: string;
    reason: string;
    point: TooltipPoint;
  } | null>(null);
  const aidStacks = useMemo(() => makeAidSupplyStacks(mapId, difficulty), [mapId, difficulty]);

  if (!mapHasDifficulty(mapId)) return null;

  const grouped = rewards.reduce<Record<string, ItemStack>>((result, stack) => {
    const existing = result[stack.itemId];
    if (existing) existing.count += stack.count;
    else result[stack.itemId] = { ...stack };
    return result;
  }, {});

  return (
    <aside
      className={s.panel}
      data-active={active}
      aria-hidden={!active}
      aria-label="难度、援助物资与每日奖励"
    >
      <div className={s.difficultyRow} aria-label="选择地图难度">
        {MAP_DIFFICULTY_IDS.map((id) => {
          const definition = getMapDifficulty(id);
          const unlocked = isDifficultyUnlocked(mapId, id, clearedKeys);
          const reason = difficultyLockReason(mapId, id, clearedKeys);
          return (
            <span
              key={id}
              className={s.lockTarget}
              tabIndex={!unlocked && active ? 0 : -1}
              onPointerEnter={(event) => {
                if (!reason) return;
                setLockTooltip({
                  name: definition.name,
                  reason,
                  point: tooltipPointFromElement(event.currentTarget, "top"),
                });
              }}
              onPointerLeave={() => setLockTooltip(null)}
              onFocus={(event) => {
                if (!reason) return;
                setLockTooltip({
                  name: definition.name,
                  reason,
                  point: tooltipPointFromElement(event.currentTarget, "top"),
                });
              }}
              onBlur={() => setLockTooltip(null)}
            >
              <button
                className={s.difficultyButton}
                type="button"
                disabled={!active || !unlocked}
                aria-pressed={difficulty === id}
                onClick={() => onSelect(id)}
              >
                {definition.name}
                {!unlocked && <span aria-hidden="true"> 🔒</span>}
              </button>
            </span>
          );
        })}
      </div>

      <PanelItemRow title="援助物资" stacks={aidStacks} active={active} />
      <PanelItemRow title="今日通关奖励" stacks={Object.values(grouped)} active={active} />

      {lockTooltip && (
        <HoverTooltip point={lockTooltip.point}>
          <strong style={{ fontSize: 18 }}>{lockTooltip.name}难度未开放</strong>
          <p style={{ fontSize: 18 }}>{lockTooltip.reason}</p>
        </HoverTooltip>
      )}
    </aside>
  );
}

export default MapDifficultyPanel;
