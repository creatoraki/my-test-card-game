import { useLayoutEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import s from "./PlaneUnit.module.css";

interface Props {
  unitsRef: MutableRefObject<Set<HTMLElement>>;
  onLayout: () => void;
  anchorDx?: number;
  anchorDy?: number;
  children: ReactNode;
}

// 敌人平面上的单位包裹层: 相机 rig 每帧往这里写线性化后的 2D matrix()(见 camera/planeProjection)。
// 包裹层本身不参与布局差异 —— 它只是 .enemy-row 的 flex 项, 尺寸完全由内部单位撑开。
// 手工站位的 dx/dy 是单位内部的视觉平移, 经 data-anchor-* 告诉 rig 线性化基点在哪。
// data-plane-unit: 供公共组件(如 HpBar)识别「会随镜头缩放」的场景, 切换成不上合成层的动画写法。
// 尺寸变化(死亡收起信息栏等)时通知 rig 补写 —— 相机静止在推近态时不会有下一帧来纠正。
export function PlaneUnit({ unitsRef, onLayout, anchorDx, anchorDy, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const units = unitsRef.current;
    units.add(el);
    onLayout();
    const observer = new ResizeObserver(() => onLayout());
    observer.observe(el);
    return () => {
      observer.disconnect();
      units.delete(el);
    };
  }, [anchorDx, anchorDy, onLayout, unitsRef]);

  return (
    <div ref={ref} className={s.unit} data-plane-unit="" data-anchor-dx={anchorDx ?? 0} data-anchor-dy={anchorDy ?? 0}>
      {children}
    </div>
  );
}
