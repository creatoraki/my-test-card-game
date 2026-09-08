// 确认弹层的装饰构件 —— 与据点建筑招牌(ui/town/TownScreen/StationLayer)同一套语言:
// 侧边卡箍 → 引线锚点 → 编号带 → 分隔线 → 正文 → 分隔线 → 指示灯。
// ★ 只画装饰, 不参与布局: 整层 position: absolute + pointer-events: none。
// ⚠ 面板外形(左上/右下切角)不在这里, 在 .content 的两枚伪元素上 —— 见 module.css 顶部说明。

import { cx } from "@/ui/common/cx";
import s from "./ConfirmDialog.module.css";

export function ConfirmDecor({ danger = false }: { danger?: boolean }) {
  return (
    <div className={s.decor} aria-hidden="true">
      <i className={cx(s.rail, s.railTl)} />
      <i className={cx(s.rail, s.railBr)} />
      <span className={s.hanger} />
      <span className={s.code}>系统确认 // 0x1A{danger ? " · 危险操作" : ""}</span>
      <span className={cx(s.divider, s.dividerTop)} />
      <span className={cx(s.divider, s.dividerBottom)} />
      <span className={s.light} data-danger={danger ? "true" : undefined} />
    </div>
  );
}
