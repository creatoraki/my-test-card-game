// 陈列台的单个"画板": 外框 + 透视扫描网格 + 角码 + 层数角标。
// 图标本体不知道这一层的存在, 这里只负责把它摆上画布。
import { cx } from "@/ui/common/cx";
import { GrowthPlateArt, GrowthPlateBackdrop, type GrowthPlateSpec } from "../../GrowthPlate";
import s from "./GrowthPlateCard.module.css";

type Props = {
  spec: GrowthPlateSpec;
  /** 画板边长(px)。不传则铺满外层容器 —— 尺寸阶梯靠这个参数拉档。 */
  size?: number;
  /** 左上角码, 不传则不画。 */
  corner?: string;
  /** 层数角标。培育的核心表达就是这个数, 归零即成熟。 */
  stack?: number;
  /** 文字角标, 与层数二选一(成熟态用「完成」)。 */
  badge?: string;
  /** 关掉网格: 小尺寸下网格会把线框吃掉。 */
  plain?: boolean;
};

export function GrowthPlateCard({ spec, size, corner, stack, badge, plain }: Props) {
  return (
    <span
      className={cx(s.plate, plain && s.plateBare)}
      style={{ "--plate-accent": spec.accent, inlineSize: size } as React.CSSProperties}
    >
      {plain ? null : <span className={s.gridLines} />}
      {corner ? <span className={s.corner}>{corner}</span> : null}
      <GrowthPlateBackdrop spec={spec} />
      <GrowthPlateArt spec={spec} />
      {stack === undefined ? null : <span className={s.stack}>{stack}</span>}
      {badge ? <span className={s.badge}>{badge}</span> : null}
    </span>
  );
}
