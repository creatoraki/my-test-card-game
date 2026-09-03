// 统一的卡牌交互提示 —— 悬浮时在宿主容器**外侧**四角浮出 L 型科技蓝呼吸边框,
// 也可由 active prop 直接点亮来表达「已选中」。
// 纯装饰层: aria-hidden + pointer-events:none, 不改变命中区, 也不承载业务状态。
//
// 宿主三条硬要求(详见 InteractiveHint.module.css 文件头):
//   ① position: relative  ② 挂 data-interactive-hint 属性  ③ 自身不能 overflow: hidden
// 显隐完全由 CSS 读宿主的 :hover / :focus-visible / :focus-within 驱动, 组件侧零 JS。

import { cx } from "@/ui/common/cx";
import s from "./InteractiveHint.module.css";

interface Props {
  /** 调用方的几何/配色覆盖类(--ihint-* 变量)。 */
  className?: string;
  /** 直接点亮提示框, 用于表达卡牌「已选中」(旧卡牌选中框已废弃)。 */
  active?: boolean;
}

export function InteractiveHint({ className, active = false }: Props) {
  return (
    <span className={cx(s.hint, active && s["is-active"], className)} aria-hidden>
      <span className={cx(s.corner, s["is-tl"])} />
      <span className={cx(s.corner, s["is-tr"])} />
      <span className={cx(s.corner, s["is-bl"])} />
      <span className={cx(s.corner, s["is-br"])} />
    </span>
  );
}
