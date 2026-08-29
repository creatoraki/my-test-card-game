// 尺寸阶梯: 同一枚图标从展示图一路缩到状态条里的实际用量。
// 大图好看不代表小图能用 —— 20px 这一档才是硬指标。
import type { GrowthPlateSpec } from "../../GrowthPlate";
import { GrowthPlateCard } from "./GrowthPlateCard";
import s from "./GrowthSizeLadder.module.css";

/** 从陈列尺寸一路缩到状态条尺寸。 */
export const LADDER_SIZES = [96, 64, 48, 32, 24, 20] as const;

/** 48px 以下关掉网格与内发光: 网格会把线框吃掉, 判断不了剪影。 */
const PLAIN_BELOW = 40;

export function GrowthSizeLadder({ spec }: { spec: GrowthPlateSpec }) {
  return (
    <div className={s.row}>
      <span className={s.rowLabel} style={{ color: spec.accent }}>
        {spec.name}
      </span>
      <div className={s.items}>
        {LADDER_SIZES.map((size) => (
          <div key={size} className={s.item}>
            <GrowthPlateCard spec={spec} size={size} plain={size < PLAIN_BELOW} />
            <small>{size}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
