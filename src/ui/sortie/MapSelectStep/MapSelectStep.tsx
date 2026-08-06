import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
  type WheelEvent,
} from "react";
import { MAPS } from "@/data";
import { cx } from "@/ui/common/cx";
import { mapArt } from "@/ui/art/mapArt";
import s from "./MapSelectStep.module.css";

interface Props {
  active: boolean;
  entering: boolean;
  intro: boolean;
  selectedMapId: string;
  onSelectMap: (mapId: string) => void;
}

const SLICE_STEP = 214;
const WHEEL_GAP_MS = 90;
const COPY_COUNT = 3;
const MIDDLE_COPY = 1;
const MAP_COUNT = MAPS.length;
/** 视口内中心项上下各需保留的切片数，虚拟索引逼近该边界时必须归位 */
const EDGE_MARGIN = 2;

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

export function MapSelectStep({ active, entering, intro, selectedMapId, onSelectMap }: Props) {
  const selected = MAPS.find((map) => map.id === selectedMapId) ?? MAPS[0];
  const selectedIndex = selected ? Math.max(0, MAPS.findIndex((map) => map.id === selected.id)) : 0;
  const wheelAtRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const virtualIndexRef = useRef(MAP_COUNT + selectedIndex);
  const isMovingRef = useRef(false);
  const isResettingRef = useRef(false);
  const pendingOffsetRef = useRef(0);
  const [virtualIndex, setVirtualIndex] = useState(MAP_COUNT + selectedIndex);
  const [isMoving, setIsMoving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const commitVirtualIndex = useCallback((nextIndex: number) => {
    virtualIndexRef.current = nextIndex;
    setVirtualIndex(nextIndex);
  }, []);

  /** 把虚拟索引瞬移到中间副本的等价位置（视觉无变化），下一帧再恢复动画 */
  const rebaseToMiddle = useCallback(() => {
    commitVirtualIndex(MAP_COUNT + wrapIndex(virtualIndexRef.current, MAP_COUNT));
    isResettingRef.current = true;
    setIsResetting(true);
  }, [commitVirtualIndex]);

  const finishMove = useCallback(() => {
    if (!isMovingRef.current || MAP_COUNT === 0) return;

    const centeredIndex = MAP_COUNT + wrapIndex(virtualIndexRef.current, MAP_COUNT);
    if (virtualIndexRef.current === centeredIndex) {
      isMovingRef.current = false;
      setIsMoving(false);
      return;
    }

    rebaseToMiddle();
  }, [rebaseToMiddle]);

  useLayoutEffect(() => {
    if (!isResetting) return;

    const settle = () => {
      isResettingRef.current = false;
      setIsResetting(false);

      const pending = pendingOffsetRef.current;
      pendingOffsetRef.current = 0;
      if (pending !== 0) {
        // 归位期间积压的滚动：位置已在中间副本，此刻带动画补上
        commitVirtualIndex(virtualIndexRef.current + pending);
        return;
      }

      isMovingRef.current = false;
      setIsMoving(false);
    };

    const list = listRef.current;
    if (!list) {
      settle();
      return;
    }

    list.getBoundingClientRect();
    const frame = window.requestAnimationFrame(settle);

    return () => window.cancelAnimationFrame(frame);
  }, [commitVirtualIndex, isResetting]);

  useEffect(() => {
    if (isMoving || !selected || MAP_COUNT === 0) return;

    const currentIndex = wrapIndex(virtualIndexRef.current, MAP_COUNT);
    if (currentIndex !== selectedIndex) commitVirtualIndex(MAP_COUNT + selectedIndex);
  }, [commitVirtualIndex, isMoving, selected, selectedIndex]);

  useEffect(() => {
    if (active) return;
    isMovingRef.current = false;
    isResettingRef.current = false;
    pendingOffsetRef.current = 0;
    setIsMoving(false);
    setIsResetting(false);
    if (MAP_COUNT > 0) commitVirtualIndex(MAP_COUNT + selectedIndex);
  }, [active, commitVirtualIndex, selectedIndex]);

  const step = useCallback((offset: number) => {
    if (!active || MAP_COUNT <= 1 || offset === 0) return;

    // 归位帧内不能改目标（此时动画被关掉，改了会瞬移），先积压
    if (isResettingRef.current) {
      pendingOffsetRef.current += offset;
      return;
    }

    const nextVirtualIndex = virtualIndexRef.current + offset;
    const nextId = MAPS[wrapIndex(nextVirtualIndex, MAP_COUNT)]?.id;
    if (!nextId) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commitVirtualIndex(MAP_COUNT + wrapIndex(nextVirtualIndex, MAP_COUNT));
      onSelectMap(nextId);
      return;
    }

    isMovingRef.current = true;
    setIsMoving(true);
    onSelectMap(nextId);

    // 连续滚动会让虚拟索引一路漂移，逼近副本边界前先无动画归位
    const lastIndex = COPY_COUNT * MAP_COUNT - 1;
    if (nextVirtualIndex < EDGE_MARGIN || nextVirtualIndex > lastIndex - EDGE_MARGIN) {
      pendingOffsetRef.current = offset;
      rebaseToMiddle();
      return;
    }

    commitVirtualIndex(nextVirtualIndex);
  }, [active, commitVirtualIndex, onSelectMap, rebaseToMiddle]);

  const select = useCallback((nextId: string) => {
    if (!active || MAP_COUNT <= 1) return;

    const nextIndex = MAPS.findIndex((map) => map.id === nextId);
    if (nextIndex < 0) return;

    const currentIndex = wrapIndex(virtualIndexRef.current, MAP_COUNT);
    let offset = nextIndex - currentIndex;
    if (Math.abs(offset) === MAP_COUNT / 2) {
      offset = MAP_COUNT / 2;
    } else if (offset > MAP_COUNT / 2) {
      offset -= MAP_COUNT;
    } else if (offset < -MAP_COUNT / 2) {
      offset += MAP_COUNT;
    }

    step(offset);
  }, [active, step]);

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

  const shift = -(virtualIndex + 0.5) * SLICE_STEP;
  const onListTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.propertyName === "transform") finishMove();
  };

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

              return (
                <button
                  key={`${copy}-${map.id}`}
                  className={cx(s["sm-slice"], isCurrent && s["sm-is-on"])}
                  type="button"
                  role={isSemantic ? "option" : undefined}
                  aria-selected={isSemantic ? map.id === selected.id : undefined}
                  aria-hidden={isSemantic ? undefined : true}
                  tabIndex={isSemantic ? 0 : -1}
                  aria-label={`选择${map.name}`}
                  onClick={() => select(map.id)}
                >
                  <img className={s["sm-slice-art"]} src={mapArt(map.id)} alt="" draggable={false} />
                  <span className={s["sm-slice-copy"]}>
                    <span className={s["sm-slice-no"]}>{`SECTOR-${String(index + 1).padStart(2, "0")}`}</span>
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
