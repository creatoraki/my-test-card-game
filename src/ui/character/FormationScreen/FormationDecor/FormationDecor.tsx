// 编队页背景装饰层: 扫描线、斜向光带、两侧警示条纹、底部刻度导轨。
// ★ 纯装饰, 压在底图暗罩之上、卡阵之下(z-index 0), 不接收任何指针事件。
// ★ 两态(编队 / 详情)共用, 与底图一样从头到尾不动 —— 只有光带自己缓慢漂移。
// ⚠ 坐标都是设计 px, 已避开顶部通栏(24..172)、卡阵(76..1844 × 196..968)与左下返回按钮。

import s from "./FormationDecor.module.css";

export function FormationDecor() {
  return (
    <div className={s.decor} aria-hidden="true">
      <div className={s.scan} />
      <div className={s.beam} data-beam="a" />
      <div className={s.beam} data-beam="b" />

      <div className={s.hazard} data-side="left" />
      <div className={s.hazard} data-side="right" />
      <div className={s.bars} />

      <svg className={s.rail} viewBox="0 0 1600 40" fill="none">
        <path className={s["rail-line"]} d="M40 12 H1600" />
        <path className={s["rail-accent"]} d="M40 12 H240" />
        <path className={s["rail-slash"]} d="M0 24 L10 4 M14 24 L24 4 M28 24 L38 4" />
      </svg>
      <div className={s.ticks} />
    </div>
  );
}
