import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { cssVars, fxAnim, fxAnims } from "@/ui/battle/fx/shared/fxKit";
import {
  AROUND_IMPACT, CUTS, CUT_INTERVAL, CUT_SWIPE, FINAL_CUT, FINAL_SWIPE, PETALS, type Cut,
} from "./sakuraFlurryGeometry";
import s from "./SakuraFlurryFx.module.css";

/** 单刀的局部坐标系: 旋转到刀向、沿法线平移, 反手刀再水平翻转。 */
const cutFrame = (cut: Cut): CSSProperties => ({
  transform: `rotate(${cut.angle}deg) translateY(${cut.offset}px) scaleX(${cut.reverse ? -1 : 1})`,
  ...cssVars({ "--len": `${cut.length}px` }),
});

/** 绯樱乱刃: 目标中心为原点, 挂载即播; key 换新即重播。 */
export function SakuraFlurryFx({ preset }: { preset: ProcFxPreset }) {
  const impact = Math.max(preset.impactMs, 0);
  const at = ({ delay, duration }: { delay: number; duration: number }, offset = 0) =>
    fxAnim(impact + delay + offset, duration);
  const { gather, coreBurst, scarBurst, finalSplit, flash, petals } = AROUND_IMPACT;
  const finalStart = impact - FINAL_SWIPE;

  return (
    <div className={s.wrap}>
      <span className={s.flash} style={at(flash)} />

      {CUTS.map((cut, index) => {
        const start = index * CUT_INTERVAL;
        return (
          <div key={`cut-${index}`} className={s.cut} style={cutFrame(cut)}>
            <span
              className={s.scar}
              style={fxAnims(
                [start, CUT_SWIPE],
                [start + CUT_SWIPE, 220],
                [impact + scarBurst.delay, scarBurst.duration],
              )}
            />
            <span className={s.streak} style={fxAnim(start, CUT_SWIPE)} />
          </div>
        );
      })}

      <div className={s.cut} style={cutFrame(FINAL_CUT)}>
        <span className={s.finalScar} style={fxAnims([finalStart, FINAL_SWIPE], [impact + 60, 360])} />
        <span className={`${s.split} ${s.splitUp}`} style={at(finalSplit)} />
        <span className={`${s.split} ${s.splitDown}`} style={at(finalSplit)} />
        <span className={`${s.streak} ${s.finalStreak}`} style={fxAnim(finalStart, FINAL_SWIPE)} />
      </div>

      <span
        className={s.core}
        style={fxAnims(
          [impact + gather.delay, gather.duration],
          [impact + coreBurst.delay, coreBurst.duration],
        )}
      />

      {PETALS.map((petal, index) => (
        <span
          key={`petal-${index}`}
          className={s.petal}
          style={{
            ...at(petals, petal.delay),
            width: petal.size,
            height: Math.round(petal.size * 0.6),
            ...cssVars({
              "--x": `${petal.x}px`,
              "--y": `${petal.y}px`,
              "--dx": `${petal.dx}px`,
              "--dy": `${petal.dy}px`,
              "--tilt": `${petal.tilt}deg`,
              "--spin": `${petal.spin}deg`,
            }),
          }}
        />
      ))}
    </div>
  );
}
