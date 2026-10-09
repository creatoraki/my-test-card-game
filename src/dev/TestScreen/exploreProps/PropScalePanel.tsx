import { SCALE_MAX, SCALE_MIN, SHOWCASE_PROPS, showcaseSize } from "./showcaseProps";
import { ScaleKnob } from "./ScaleKnob";
import s from "./ExplorePropScene.module.css";

const round = (value: number) => Math.round(value * 1000) / 1000;

/** 打印每件展示交互物的游戏登记缩放、旋钮倍率与叠乘后的最终缩放，方便回填 commonPropArt。 */
function printScales(multipliers: Record<string, number>) {
  console.table(SHOWCASE_PROPS.map((prop) => {
    const multiplier = multipliers[prop.id] ?? 1;
    const { width, height } = showcaseSize(prop.art, multiplier);
    return {
      名称: prop.name,
      游戏登记缩放: round(prop.art.scale),
      旋钮倍率: round(multiplier),
      最终缩放: round(prop.art.scale * multiplier),
      显示宽度: Math.round(width),
      显示高度: Math.round(height),
    };
  }));
}

export function PropScalePanel({ multipliers, onChange }: {
  multipliers: Record<string, number>; onChange: (id: string, value: number) => void;
}) {
  return <aside className={s.panel}>
    {SHOWCASE_PROPS.map((prop) => {
      const value = multipliers[prop.id] ?? 1;
      return <div key={prop.id} className={s.knobRow}>
        <ScaleKnob value={value} min={SCALE_MIN} max={SCALE_MAX} label={`${prop.name}缩放倍率`} onChange={(next) => onChange(prop.id, next)} />
        <div className={s.knobInfo}>
          <strong>{prop.name}</strong>
          <span>旋钮倍率 {value.toFixed(2)}</span>
          <span>最终缩放 {(prop.art.scale * value).toFixed(3)}</span>
        </div>
      </div>;
    })}
    <p className={s.hint}>上下拖动或滚轮调节 · 双击复位</p>
    <button type="button" className={s.printButton} onClick={() => printScales(multipliers)}>打印缩放倍率到控制台</button>
  </aside>;
}
