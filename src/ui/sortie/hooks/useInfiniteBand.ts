// ============================================================================
// 无限滚动转轮 —— 出击界面「斜切长条」列表(目标层选择 / 货柜)的共用滚动内核。
//
// ★ 思路: DOM 里渲染 COPY_COUNT 份相同条目, 光标走的是「虚拟索引」而不是真实索引。
//   虚拟索引一路单调增减 ⇒ translateY 也单调变化 ⇒ 循环时不会出现跳帧。
//   等它漂到副本边界前, 关掉动画把它瞬移回中间副本的等价位置(视觉无变化), 下一帧再开动画。
//
// ★ 这套边界处理(归位帧、积压偏移)是调过的, 改动前先想清楚 rebaseToMiddle 的时序。
// ============================================================================

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type TransitionEvent,
} from "react";

/** DOM 中渲染的副本份数 */
export const COPY_COUNT = 3;
/** 承担语义(role/aria/tab)的那一份副本下标 */
export const MIDDLE_COPY = 1;
/** 视口内中心项上下各需保留的切片数，虚拟索引逼近该边界时必须归位 */
const EDGE_MARGIN = 2;
const DEFAULT_SLICE_STEP = 214;
const DEFAULT_WHEEL_GAP_MS = 90;

export function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

interface Options {
  active: boolean;
  /** 条目总数(单份副本的长度) */
  count: number;
  /** 当前选中的真实索引 */
  selectedIndex: number;
  /** 转轮停在某个真实索引上时回调 */
  onSelect: (index: number) => void;
  /** 单个切片的高度步进(px) */
  sliceStep?: number;
  /** 两次滚轮之间的最小间隔(ms) */
  wheelGapMs?: number;
  /** 传了就把原生 wheel 监听挂到该元素上; 否则调用方自己用返回的 onWheel */
  wheelTarget?: RefObject<HTMLElement | null>;
}

export function useInfiniteBand({
  active,
  count,
  selectedIndex,
  onSelect,
  sliceStep = DEFAULT_SLICE_STEP,
  wheelGapMs = DEFAULT_WHEEL_GAP_MS,
  wheelTarget,
}: Options) {
  const wheelAtRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const virtualIndexRef = useRef(count + selectedIndex);
  const isMovingRef = useRef(false);
  const isResettingRef = useRef(false);
  const pendingOffsetRef = useRef(0);
  const [virtualIndex, setVirtualIndex] = useState(count + selectedIndex);
  const [isMoving, setIsMoving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // onSelect 常是内联箭头函数, 存进 ref 免得每次渲染都让 step/select 失效
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const commitVirtualIndex = useCallback((nextIndex: number) => {
    virtualIndexRef.current = nextIndex;
    setVirtualIndex(nextIndex);
  }, []);

  /** 把虚拟索引瞬移到中间副本的等价位置（视觉无变化），下一帧再恢复动画 */
  const rebaseToMiddle = useCallback(() => {
    commitVirtualIndex(count + wrapIndex(virtualIndexRef.current, count));
    isResettingRef.current = true;
    setIsResetting(true);
  }, [commitVirtualIndex, count]);

  const finishMove = useCallback(() => {
    if (!isMovingRef.current || count === 0) return;

    const centeredIndex = count + wrapIndex(virtualIndexRef.current, count);
    if (virtualIndexRef.current === centeredIndex) {
      isMovingRef.current = false;
      setIsMoving(false);
      return;
    }

    rebaseToMiddle();
  }, [count, rebaseToMiddle]);

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
    if (isMoving || count === 0) return;

    const currentIndex = wrapIndex(virtualIndexRef.current, count);
    if (currentIndex !== selectedIndex) commitVirtualIndex(count + selectedIndex);
  }, [commitVirtualIndex, count, isMoving, selectedIndex]);

  useEffect(() => {
    if (active) return;
    isMovingRef.current = false;
    isResettingRef.current = false;
    pendingOffsetRef.current = 0;
    setIsMoving(false);
    setIsResetting(false);
    if (count > 0) commitVirtualIndex(count + selectedIndex);
  }, [active, commitVirtualIndex, count, selectedIndex]);

  const step = useCallback((offset: number) => {
    if (!active || count <= 1 || offset === 0) return;

    // 归位帧内不能改目标（此时动画被关掉，改了会瞬移），先积压
    if (isResettingRef.current) {
      pendingOffsetRef.current += offset;
      return;
    }

    const nextVirtualIndex = virtualIndexRef.current + offset;
    const nextIndex = wrapIndex(nextVirtualIndex, count);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commitVirtualIndex(count + nextIndex);
      onSelectRef.current(nextIndex);
      return;
    }

    isMovingRef.current = true;
    setIsMoving(true);
    onSelectRef.current(nextIndex);

    // 连续滚动会让虚拟索引一路漂移，逼近副本边界前先无动画归位
    const lastIndex = COPY_COUNT * count - 1;
    if (nextVirtualIndex < EDGE_MARGIN || nextVirtualIndex > lastIndex - EDGE_MARGIN) {
      pendingOffsetRef.current = offset;
      rebaseToMiddle();
      return;
    }

    commitVirtualIndex(nextVirtualIndex);
  }, [active, commitVirtualIndex, count, rebaseToMiddle]);

  /** 选到某个真实索引 —— 自动挑正反方向里更短的那条路 */
  const select = useCallback((nextIndex: number) => {
    if (!active || count <= 1 || nextIndex < 0 || nextIndex >= count) return;

    const currentIndex = wrapIndex(virtualIndexRef.current, count);
    let offset = nextIndex - currentIndex;
    if (Math.abs(offset) === count / 2) {
      offset = count / 2;
    } else if (offset > count / 2) {
      offset -= count;
    } else if (offset < -count / 2) {
      offset += count;
    }

    step(offset);
  }, [active, count, step]);

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

  // React 合成事件与原生 wheel 事件都只用到 deltaY, 这里取最小交集
  const onWheel = useCallback((event: { deltaY: number }) => {
    if (!active || event.deltaY === 0) return;
    const now = performance.now();
    if (now - wheelAtRef.current < wheelGapMs) return;
    wheelAtRef.current = now;
    step(event.deltaY > 0 ? 1 : -1);
  }, [active, step, wheelGapMs]);

  useEffect(() => {
    const target = wheelTarget?.current;
    if (!target) return;
    target.addEventListener("wheel", onWheel);
    return () => target.removeEventListener("wheel", onWheel);
  }, [onWheel, wheelTarget]);

  const onListTransitionEnd = useCallback((event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.propertyName === "transform") finishMove();
  }, [finishMove]);

  return {
    virtualIndex,
    isMoving,
    isResetting,
    /** 列表容器的 translateY 偏移量(px, 未带单位) */
    shift: -(virtualIndex + 0.5) * sliceStep,
    listRef,
    step,
    select,
    onWheel,
    onListTransitionEnd,
  };
}
