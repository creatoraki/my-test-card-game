import { type CSSProperties } from "react";
import { isMapUnlocked, mapLockReason, type MapDef, type MapDifficulty } from "@/data";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import { mapArt } from "@/ui/art/mapArt";
import { COPY_COUNT, MIDDLE_COPY, useInfiniteBand } from "@/ui/sortie/hooks";
import { SortieFrame } from "@/ui/sortie/SortieFrame";
import { SortieGlyph } from "@/ui/sortie/SortieGlyph";
import { MapSelectChrome } from "./MapSelectChrome";
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
      data-active={active}
      data-moving={isMoving}
      data-resetting={isResetting || undefined}
      aria-hidden={!active}
      aria-busy={isMoving}
      aria-label="目标层选择"
    >
      <MapSelectChrome />
      <div className={cx(s["sm-band"], intro && s["sm-band-intro"], entering && s["sm-band-enter"])}>
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
              const isCurrent = itemIndex === virtualIndex;
              const isSemantic = copy === MIDDLE_COPY;
              const locked = !isTest && !isMapUnlocked(map.id, clearedMaps);
              const lockReason = isTest ? null : mapLockReason(map.id, clearedMaps);

              return (
                <div
                  key={`${copy}-${map.id}`}
                  className={s["sm-slice-slot"]}
                  style={{ "--neighbor-shift": `${itemIndex < virtualIndex ? -21 : itemIndex > virtualIndex ? 21 : 0}px` } as CSSProperties}
                >
                <button
                  className={cx(s["sm-slice"], isCurrent && s["sm-is-on"])}
                  type="button"
                  data-locked={locked ? "true" : undefined}
                  role={isSemantic ? "option" : undefined}
                  aria-selected={isSemantic ? map.id === selected.id : undefined}
                  aria-hidden={isSemantic ? undefined : true}
                  tabIndex={isSemantic && active ? 0 : -1}
                  aria-label={locked ? `${map.name}（未开放）` : `选择${map.name}`}
                  onClick={() => select(index)}
                >
                  <span className={s["sm-slice-surface"]}>
                    <img className={s["sm-slice-art"]} src={mapArt(map.id)} alt="" draggable={false} />
                  </span>
                  <SortieFrame width={isCurrent ? 516 : 474} height={isCurrent ? 188 : 146} selected={isCurrent} />
                  <span className={s["sm-slice-detail"]} aria-hidden="true">···</span>
                  {isCurrent && <>
                    <span className={s["sm-current-tag"]}>
                      <SortieFrame width={114} height={39} notch={8} metal={false} />
                      <span className={s["sm-current-label"]}>当前</span>
                    </span>
                    <span className={s["sm-locator"]} />
                    <SortieGlyph name="beacon" className={s["sm-current-icon"]} />
                  </>}
                  <span className={s["sm-slice-copy"]}>
                    <strong className={s["sm-slice-name"]}>{map.name}</strong>
                    {locked && <span className={s["sm-slice-status"]}>{isCurrent ? lockReason ?? "暂未开放" : "暂未开放"}</span>}
                    {isCurrent && <span className={s["sm-current-rule"]} aria-hidden="true" />}
                  </span>
                  {locked && <SortieGlyph name="lock" className={s["sm-slice-lock"]} />}
                </button>
                </div>
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
        active={active}
      />
    </section>
  );
}

export default MapSelectStep;
