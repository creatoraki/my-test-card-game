// 设施内的「返回据点」—— 这一页唯一的出口, 所以视觉上比全景里的小字按钮亮一档。
//
// ⚠ 返回演出开始后它不会立刻卸载: leaving 期间跟着背景一起淡出, 否则背景还在做像素转场、
//   按钮却已经硬切消失, 读起来很跳。

import { cx } from "@/ui/common/cx";
import s from "./FacilityBack.module.css";

export interface FacilityBackProps {
  /** 返回演出已开始: 自己淡出。 */
  leaving?: boolean;
  onClick: () => void;
}

export function FacilityBack({ leaving = false, onClick }: FacilityBackProps) {
  return (
    <button
      className={cx(s.back, leaving && s["is-leaving"])}
      type="button"
      aria-label="返回据点"
      onClick={onClick}
    >
      <span className={s.arrow} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M15 4 7 12l8 8"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={s.label}>返回据点</span>
    </button>
  );
}
