import { type CSSProperties } from "react";
import { isMapUnlocked, MAPS, mapLockReason } from "@/data";
import { cx } from "@/ui/common/cx";
import { mapArt } from "@/ui/art/mapArt";
import { COPY_COUNT, MIDDLE_COPY, useInfiniteBand } from "@/ui/sortie/hooks";
import { MapLockChains } from "./MapLockChains";
import s from "./MapSelectStep.module.css";

interface Props {
  active: boolean;
  entering: boolean;
  intro: boolean;
  selectedMapId: string;
  clearedMaps: readonly string[];
  onSelectMap: (mapId: string) => void;
}

const MAP_COUNT = MAPS.length;

export function MapSelectStep({
  active,
  entering,
  intro,
  selectedMapId,
  clearedMaps,
  onSelectMap,
}: Props) {
  const selected = MAPS.find((map) => map.id === selectedMapId) ?? MAPS[0];
  const selectedIndex = selected ? Math.max(0, MAPS.findIndex((map) => map.id === selected.id)) : 0;

  const { virtualIndex, isMoving, isResetting, shift, listRef, select, onWheel, onListTransitionEnd } =
    useInfiniteBand({
      active,
      count: MAP_COUNT,
      selectedIndex,
      onSelect: (index) => {
        const nextId = MAPS[index]?.id;
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
            MAPS.map((map, index) => {
              const itemIndex = copy * MAP_COUNT + index;
              const isCurrent = itemIndex === virtualIndex;
              const isSemantic = copy === MIDDLE_COPY;
              const locked = !isMapUnlocked(map.id, clearedMaps);
              const lockReason = mapLockReason(map.id, clearedMaps);

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
    </section>
  );
}

export default MapSelectStep;
