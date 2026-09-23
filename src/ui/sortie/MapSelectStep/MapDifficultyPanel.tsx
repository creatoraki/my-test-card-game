import { useMemo, useState } from "react";
import {
  difficultyLockReason,
  getMapDifficulty,
  isDifficultyUnlocked,
  makeAidSupplyStacks,
  mapDifficultyIds,
  mapHasDifficulty,
  fixedClearRewardOf,
  type MapDifficulty,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { HoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { PanelItemRow } from "./PanelItemRow";
import { SortieFrame } from "@/ui/sortie/SortieFrame";
import { SortieGlyph } from "@/ui/sortie/SortieGlyph";
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
  const hasDifficulty = mapHasDifficulty(mapId);
  const difficultyIds = mapDifficultyIds(mapId);
  const hasDifficultySelection = difficultyIds.length > 0;

  if (!hasDifficultySelection && !fixedClearRewardOf(mapId)) return null;

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
      aria-label={hasDifficultySelection ? "难度、配额物资与每日奖励" : "配额物资与通关奖励"}
    >
      {hasDifficultySelection ? (
        <div className={s.difficultySection}>
          <div className={s.surface} />
          <SortieFrame width={814} height={176} />
          <h2 className={s.heading}><SortieGlyph name="sliders" className={s.headingIcon} />难度选择<span className={s.headingSlash}>／／</span><span className={s.headingDots} aria-hidden="true">···•</span></h2>
          <div className={s.difficultyRow} aria-label="选择地图难度">
            {difficultyIds.map((id) => {
              const definition = getMapDifficulty(id);
              const unlocked = isDifficultyUnlocked(mapId, id, clearedKeys);
              const reason = difficultyLockReason(mapId, id, clearedKeys);
              return (
                <span
                  key={id}
                  className={s.lockTarget}
                  data-locked={!unlocked || undefined}
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
                    <span className={s.buttonSurface} />
                    <SortieFrame width={239.33} height={102} notch={10} metal={false} selected={difficulty === id} />
                    <SortieGlyph name={!unlocked ? "lock" : id === "normal" ? "beacon" : id === "hard" ? "skull" : "abyss"} className={s.difficultyIcon} />
                    <span className={s.difficultyName}>{definition.name}</span>
                    {!unlocked && <span className={s.lockCaption}>未解锁</span>}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={s.difficultyPlaceholder} aria-hidden="true" />
      )}

      <div className={s.rewards}>
        <PanelItemRow title="配额物资" kind="aid" stacks={aidStacks} active={active} />
        <PanelItemRow
          title={hasDifficulty ? "当前地图额外物品奖励" : "通关奖励"}
          kind="daily"
          stacks={Object.values(grouped)}
          active={active}
        />
      </div>

      {active && lockTooltip && (
        <HoverTooltip point={lockTooltip.point}>
          <TooltipCard title={`${lockTooltip.name}难度未开放`} desc={lockTooltip.reason} />
        </HoverTooltip>
      )}
    </aside>
  );
}

export default MapDifficultyPanel;
