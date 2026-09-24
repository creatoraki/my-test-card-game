import { memo, useMemo, type CSSProperties } from "react";
import { isMapUnlocked, mapLockReason, type MapDef, type MapDifficulty } from "@/data";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/shared/cx";
import { COPY_COUNT, MIDDLE_COPY, useInfiniteBand } from "@/ui/sortie/hooks";
import { isMotionActive, type StepMotion } from "@/ui/sortie/SortieScreen/sortieStepTransition";
import { MapSelectChrome } from "./MapSelectChrome";
import { MapDifficultyPanel } from "./MapDifficultyPanel";
import MapSlice from "./MapSlice";
import s from "./MapSelectStep.module.css";

const isTest = import.meta.env.isTest === "true";

interface Props {
  maps: readonly MapDef[];
  motion: StepMotion;
  selectedMapId: string;
  difficulty: MapDifficulty;
  clearedMaps: readonly string[];
  clearedKeys: readonly string[];
  dailyRewards: ItemStack[];
  onSelectMap: (mapId: string) => void;
  onSelectDifficulty: (difficulty: MapDifficulty) => void;
}

function MapSelectStep({
  maps,
  motion,
  selectedMapId,
  difficulty,
  clearedMaps,
  clearedKeys,
  dailyRewards,
  onSelectMap,
  onSelectDifficulty,
}: Props) {
  const active = isMotionActive(motion);
  const selected = maps.find((map) => map.id === selectedMapId) ?? maps[0];
  const selectedIndex = selected ? Math.max(0, maps.findIndex((map) => map.id === selected.id)) : 0;
  const mapCount = maps.length;
  // 锁定信息按地图算一次, 三份副本共用。
  const lockInfo = useMemo(
    () => maps.map((map) => ({
      locked: !isTest && !isMapUnlocked(map.id, clearedMaps),
      reason: isTest ? null : mapLockReason(map.id, clearedMaps),
    })),
    [maps, clearedMaps],
  );

  const { virtualIndex, isMoving, isResetting, shift, listRef, select, onListTransitionEnd } =
    useInfiniteBand({
      active,
      count: mapCount,
      selectedIndex,
      sliceStep: 162,
      wheelOnWindow: true,
      onSelect: (index) => {
        const nextId = maps[index]?.id;
        if (nextId) onSelectMap(nextId);
      },
    });

  if (!selected) return null;

  return (
    <section
      className={s["sm-step"]}
      data-motion={motion}
      data-active={active}
      data-moving={isMoving}
      data-resetting={isResetting || undefined}
      aria-hidden={!active}
      aria-busy={isMoving}
      aria-label="目标层选择"
    >
      <MapSelectChrome motion={motion} />
      <div className={s["sm-band"]}>
        <div className={s["sm-band-heading"]} aria-hidden="true">
          <span>····<br />···−</span><i />行动区域 <b>／／</b>
        </div>
        <div className={s["sm-band-window"]}>
          <div
            ref={listRef}
            className={cx(s["sm-band-list"], isResetting && s["sm-band-list-reset"])}
            style={{ "--shift": shift } as CSSProperties}
            role="listbox"
            aria-label="目标层"
            onTransitionEnd={onListTransitionEnd}
          >
            {Array.from({ length: COPY_COUNT }, (_, copy) =>
              maps.map((map, index) => {
                const itemIndex = copy * mapCount + index;
                const isSemantic = copy === MIDDLE_COPY;
                return (
                  <MapSlice
                    key={`${copy}-${map.id}`}
                    mapId={map.id}
                    name={map.name}
                    index={index}
                    isCurrent={itemIndex === virtualIndex}
                    neighbor={itemIndex < virtualIndex ? -1 : itemIndex > virtualIndex ? 1 : 0}
                    semantic={isSemantic}
                    selected={isSemantic && map.id === selected.id}
                    focusable={active}
                    locked={lockInfo[index].locked}
                    lockReason={lockInfo[index].reason}
                    onSelect={select}
                  />
                );
              }),
            )}
          </div>
        </div>
        <div className={s["sm-band-footer"]} aria-hidden="true">···−<i /></div>
      </div>
      <MapDifficultyPanel
        mapId={selected.id}
        difficulty={difficulty}
        clearedKeys={clearedKeys}
        rewards={dailyRewards}
        onSelect={onSelectDifficulty}
        motion={motion}
      />
    </section>
  );
}

const MemoMapSelectStep = memo(MapSelectStep);
export default MemoMapSelectStep;
