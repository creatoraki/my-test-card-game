// 统一的卡牌交互提示 —— 悬浮时在宿主容器**外侧**四角浮出 L 型科技蓝呼吸边框,
// 也可由 active prop 直接点亮来表达「已选中」。
// 纯装饰层: aria-hidden + pointer-events:none, 不改变命中区, 也不承载业务状态。
//
// ★ 辉光用 box-shadow(每段 L 臂各自外发光)而不是 filter: drop-shadow:
//   drop-shadow 属于后处理滤镜, 在宿主带 backdrop-filter / clip-path 这类玻璃合成环境里
//   会被重采样、拉成背后一片模糊投影(见角色详情页卡组 L 框发糊的 bug)。
//   box-shadow 在绘制阶段产生, 不受该合成环境干扰, 任何外壳里都保持清晰。
//
// 宿主三条硬要求(详见 InteractiveHint.module.css 文件头):
//   ① position: relative  ② 挂 data-interactive-hint 属性  ③ 自身不能 overflow: hidden
// 显隐完全由 CSS 读宿主的 :hover / :focus-visible / :focus-within 驱动, 组件侧零 JS。

import { cx } from "@/ui/common/cx";
import s from "./InteractiveHint.module.css";

const CORNERS = ["tl", "tr", "bl", "br"] as const;

interface Props {
  /** 调用方的几何/配色覆盖类(--ihint-* 变量)。 */
  className?: string;
  /** 直接点亮提示框, 用于表达卡牌「已选中」(旧卡牌选中框已废弃)。 */
  active?: boolean;
}

export function InteractiveHint({ className, active = false }: Props) {
  return (
    <span className={cx(s.hint, active && s["is-active"], className)} aria-hidden>
      {CORNERS.map((corner) => (
        <span key={corner} className={cx(s.corner, s[`is-${corner}`])}>
          <span className={cx(s.arm, s["is-h"])} />
          <span className={cx(s.arm, s["is-v"])} />
        </span>
      ))}
    </span>
  );
}
