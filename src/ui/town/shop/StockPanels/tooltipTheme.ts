import type { CSSProperties } from "react";

/** 回收台详情弹层：字号不低于项目约定的 18px，宽度覆盖公共物品卡默认值。 */
export const RECYCLE_TOOLTIP_THEME = {
  width: "420px",
  "--tooltip-detail-padding": "20px",
  "--item-detail-gap": "16px",
  "--item-detail-icon-width": "72px",
  "--item-detail-name-size": "24px",
  "--item-detail-mult-size": "19px",
  "--item-detail-tags-size": "18px",
  "--item-detail-desc-size": "19px",
  "--item-detail-stats-size": "19px",
  "--item-detail-field-size": "19px",
  "--item-detail-bond-head-size": "20px",
  "--item-detail-bond-arcana-size": "18px",
  "--item-detail-bond-count-size": "18px",
  "--item-detail-bond-desc-size": "18px",
  "--item-detail-note-size": "18px",
  "--item-detail-idle-size": "19px",
  "--item-detail-bond-icon-size": "28px",
} as CSSProperties;
