import { type CSSProperties } from "react";
import { isMapUnlocked, mapLockReason, type MapDef, type MapDifficulty } from "@/data";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import { mapArt } from "@/ui/art/mapArt";
import { COPY_COUNT, MIDDLE_COPY, useInfiniteBand } from "@/ui/sortie/hooks";
import { MapLockChains } from "./MapLockChains";
import { MapDifficultyPanel } from "./MapDifficultyPanel";
import s from "./MapSelectStep.module.css";

const isTest = import.meta.env.isTest === "true";

interface Props {
  maps: readonly MapDef[];
  active: boolean;
  entering: boolean;
  intro: boolean;
  selectedMapId: string;
  difficulty: MapDifficulty;
  clearedMaps: readonly string[];
  clearedKeys: readonly string[];
  dailyRewards: ItemStack[];
  onSelectMap: (mapId: string) => void;
  onSelectDifficulty: (difficulty: MapDifficulty) => void;
}

export function MapSelectStep({
  maps,
  active,
  entering,
  intro,
  selectedMapId,
  difficulty,
  clearedMaps,
  clearedKeys,
  dailyRewards,
  onSelectMap,
  onSelectDifficulty,
}: Props) {
  const selected = maps.find((map) => map.id === selectedMapId) ?? maps[0];
  const selectedIndex = selected ? Math.max(0, maps.findIndex((map) => map.id === selected.id)) : 0;
  const mapCount = maps.length;

  const { virtualIndex, isMoving, isResetting, shift, listRef, select, onWheel, onListTransitionEnd } =
    useInfiniteBand({
      active,
      count: mapCount,
      selectedIndex,
      onSelect: (index) => {
        const nextId = maps[index]?.id;
        if (nextId) onSelectMap(nextId);
      },
    });

  if (!selected) return null;

  return (
    <section
      className={s["sm-step"]}
      data-active={active}
      data-moving={isMoving}
      aria-hidden={!active}
      aria-busy={isMoving}
      aria-label="目标层选择"
      onWheel={onWheel}
    >
      <div className={cx(s["sm-band"], intro && s["sm-band-intro"], entering && s["sm-band-enter"])}>
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
              const isCurrent = itemIndex === virtualIndex;
              const isSemantic = copy === MIDDLE_COPY;
              const locked = !isTest && !isMapUnlocked(map.id, clearedMaps);
              const lockReason = isTest ? null : mapLockReason(map.id, clearedMaps);

              return (
                <button
                  key={`${copy}-${map.id}`}
                  className={cx(s["sm-slice"], isCurrent && s["sm-is-on"])}
                  type="button"
                  data-locked={locked ? "true" : undefined}
                  role={isSemantic ? "option" : undefined}
                  aria-selected={isSemantic ? map.id === selected.id : undefined}
                  aria-hidden={isSemantic ? undefined : true}
                  tabIndex={isSemantic ? 0 : -1}
                  aria-label={locked ? `${map.name}（未开放）` : `选择${map.name}`}
                  onClick={() => select(index)}
                >
                  <img className={s["sm-slice-art"]} src={mapArt(map.id)} alt="" draggable={false} />
                  {locked && (
                    <MapLockChains reason={lockReason ?? "暂未开放"} highlighted={isCurrent} />
                  )}
                  <span className={s["sm-slice-copy"]}>
                    <span className={s["sm-slice-no"]}>{`SECTOR-${String(index).padStart(2, "0")}`}</span>
                    <strong className={s["sm-slice-name"]}>{map.name}</strong>
                  </span>
                </button>
              );
            }),
          )}
        </div>
      </div>
      <MapDifficultyPanel
        mapId={selected.id}
        difficulty={difficulty}
        clearedKeys={clearedKeys}
        rewards={dailyRewards}
        onSelect={onSelectDifficulty}
        active={active}
      />
    </section>
  );
}

export default MapSelectStep;
