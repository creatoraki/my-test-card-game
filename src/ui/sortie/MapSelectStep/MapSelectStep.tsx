import { useCallback, useEffect, useRef, type CSSProperties, type WheelEvent } from "react";
import { MAPS } from "@/data";
import { cx } from "@/ui/common/cx";
import { mapArt } from "@/ui/art/mapArt";
import s from "./MapSelectStep.module.css";

interface Props {
  active: boolean;
  selectedMapId: string;
  onSelectMap: (mapId: string) => void;
}

const SLICE_STEP = 214;
const WHEEL_GAP_MS = 180;

export function MapSelectStep({ active, selectedMapId, onSelectMap }: Props) {
  const selected = MAPS.find((map) => map.id === selectedMapId) ?? MAPS[0];
  const wheelAtRef = useRef(0);

  const select = useCallback((nextId: string) => {
    if (nextId !== selectedMapId) onSelectMap(nextId);
  }, [onSelectMap, selectedMapId]);

  const step = useCallback((offset: number) => {
    const currentIndex = Math.max(0, MAPS.findIndex((map) => map.id === selectedMapId));
    const nextIndex = (currentIndex + offset + MAPS.length) % MAPS.length;
    const nextId = MAPS[nextIndex]?.id;
    if (nextId) onSelectMap(nextId);
  }, [onSelectMap, selectedMapId]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
      const next = event.key === "ArrowDown" || event.key === "ArrowRight";
      if (!back && !next) return;
      event.preventDefault();
      step(next ? 1 : -1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, step]);

  const onWheel = (event: WheelEvent<HTMLElement>) => {
    if (!active || event.deltaY === 0) return;
    const now = performance.now();
    if (now - wheelAtRef.current < WHEEL_GAP_MS) return;
    wheelAtRef.current = now;
    step(event.deltaY > 0 ? 1 : -1);
  };

  if (!selected) return null;

  const selectedIndex = Math.max(0, MAPS.findIndex((map) => map.id === selected.id));
  const shift = -(selectedIndex + 0.5) * SLICE_STEP;

  return (
    <section
      className={s["sm-step"]}
      data-active={active}
      aria-hidden={!active}
      aria-label="目标层选择"
      onWheel={onWheel}
    >
      <div className={s["sm-band"]}>
        <div
          className={s["sm-band-list"]}
          style={{ "--shift": shift } as CSSProperties}
          role="listbox"
          aria-label="目标层"
        >
          {MAPS.map((map, index) => (
            <button
              key={map.id}
              className={cx(s["sm-slice"], map.id === selected.id && s["sm-is-on"])}
              type="button"
              role="option"
              aria-selected={map.id === selected.id}
              aria-label={`选择${map.name}`}
              onClick={() => select(map.id)}
            >
              <img className={s["sm-slice-art"]} src={mapArt(map.id)} alt="" draggable={false} />
              <span className={s["sm-slice-copy"]}>
                <span className={s["sm-slice-no"]}>{`SECTOR-${String(index + 1).padStart(2, "0")}`}</span>
                <strong className={s["sm-slice-name"]}>{map.name}</strong>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
