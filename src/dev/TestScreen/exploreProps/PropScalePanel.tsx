import { clampScale, SCALE_MAX, SCALE_MIN, SCALE_NUDGE, SCALE_PRECISION, type ShowcasePropDef } from "./showcaseProps";
import { ScaleKnob } from "./ScaleKnob";
import { printScales } from "./printScales";
import { isPropEnabled, type PreviewTuning } from "./previewTuning";
import s from "./ExplorePropScene.module.css";

/** 倍率步进按钮：粗调 ±0.01，精调 ±0.001。 */
const NUDGE_STEPS = [-SCALE_NUDGE, -SCALE_PRECISION, SCALE_PRECISION, SCALE_NUDGE] as const;

/** 只展示当前点中物件的旋钮与启用开关；打印按钮输出全部已启用的展示物。 */
export function PropScalePanel({ prop, tuning, onChange, onToggle, onClose }: {
  prop: ShowcasePropDef; tuning: PreviewTuning;
  onChange: (id: string, value: number) => void; onToggle: (id: string, value: boolean) => void; onClose: () => void;
}) {
  const value = tuning.multipliers[prop.id] ?? 1;
  const enabled = isPropEnabled(tuning, prop.id);
  const set = (next: number) => onChange(prop.id, next);
  return <aside className={s.panel} aria-label={`${prop.name}缩放调节`}>
    <header className={s.panelHeader}>
      <strong>{prop.name}</strong>
      <button type="button" className={s.closeButton} aria-label="关闭调节面板" onClick={onClose}>×</button>
    </header>
    <button type="button" role="switch" aria-checked={enabled} className={`${s.toggle} ${enabled ? s.toggleOn : ""}`} onClick={() => onToggle(prop.id, !enabled)}>
      <span className={s.toggleTrack} aria-hidden><span className={s.toggleThumb} /></span>
      {enabled ? "启用" : "停用"}
    </button>
    <div className={s.knobRow}>
      <ScaleKnob value={value} min={SCALE_MIN} max={SCALE_MAX} precision={SCALE_PRECISION} label={`${prop.name}缩放倍率`} onChange={set} />
      <div className={s.knobInfo}>
        <span>倍率 {value.toFixed(3)}</span>
        <span>最终 {(prop.art.scale * value).toFixed(3)}</span>
        <div className={s.nudges}>
          {NUDGE_STEPS.map((step) => <button key={step} type="button" aria-label={`倍率${step < 0 ? "减少" : "增加"} ${Math.abs(step)}`} onClick={() => set(clampScale(value + step))}>
            {step < 0 ? "−" : "+"}{Math.abs(step)}
          </button>)}
          <button type="button" onClick={() => set(1)}>复位</button>
        </div>
      </div>
    </div>
    <button type="button" className={s.printButton} onClick={() => printScales(tuning)}>打印</button>
  </aside>;
}
