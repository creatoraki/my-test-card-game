// 三选一底栏按钮: 左上/右下斜切。底色层走 clip-path, 描边与辉光走按钮内的 SVG ——
// clip-path 会把 border / box-shadow 一起裁掉, 所以描边不能挂在被裁的那层上。
import type { ReactNode } from "react";
import { cx } from "@/ui/common/shared/cx";
import { BUTTON_CHAMFER, chamferBox, toSvgPoints, type Rect } from "./pickGeometry";
import s from "./PickButton.module.css";

interface Props {
  rect: Rect;
  primary?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
}

export function PickButton({ rect, primary = false, disabled, icon, children, onClick }: Props) {
  const { w, h } = rect;
  const outline = toSvgPoints(chamferBox(w, h, BUTTON_CHAMFER));
  const inner = toSvgPoints(chamferBox(w, h, BUTTON_CHAMFER, 5));
  // 主按钮外侧再套一圈细框(外扩 7px), 设计稿里像嵌在面板上的托槽。
  const bay = toSvgPoints(chamferBox(w, h, BUTTON_CHAMFER, -7));
  // 右上: 顶边右半段外移 4px 的凸起亮条, 折到右边上段。
  const corner = toSvgPoints([[w * 0.5, -4], [w + 4, -4], [w + 4, 22]]);
  // 左下: 一小段折角括弧。
  const foot = toSvgPoints([[-4, h - 30], [-4, h + 4], [36, h + 4]]);

  return (
    <button
      type="button"
      className={cx(s.button, primary && s.primary)}
      style={{ left: rect.x, top: rect.y, width: w, height: h }}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={s.face} />
      <svg className={s.edge} viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
        {primary && <polygon className={s.bay} points={bay} />}
        <polygon className={s.halo} points={outline} />
        {primary && <polygon className={s.haloWide} points={outline} />}
        <polygon className={s.line} points={outline} />
        <polygon className={s.innerLine} points={inner} />
        <polyline className={s.corner} points={corner} />
        <polyline className={s.foot} points={foot} />
      </svg>
      <span className={s.content}>
        {icon}
        <span className={s.label}>{children}</span>
      </span>
    </button>
  );
}
