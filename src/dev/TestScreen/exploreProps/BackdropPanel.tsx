import { clampScale, SCALE_MAX, SCALE_MIN, SCALE_NUDGE, SCALE_PRECISION } from "./showcaseProps";
import { ScaleKnob } from "./ScaleKnob";
import { printScales } from "./printScales";
import { DEFAULT_BACKDROP, demoBackdropGeometry, type DemoBackdrop } from "./DemoNearLayer";
import type { PreviewTuning } from "./previewTuning";
import { findNearLayer } from "./demoNearLayers";
import s from "./ExplorePropScene.module.css";

/** 上下偏移的步进：负值往上挪，正值往下挪。 */
const OFFSET_STEPS = [-10, -1, 1, 10] as const;

/** 背景近景调节：缩放旋钮沿用交互物同款，上下偏移用步进按钮；打印按钮同时输出已启用交互物与背景。 */
export function BackdropPanel({ tuning, onChange, onClose }: {
  tuning: PreviewTuning; onChange: (next: DemoBackdrop) => void; onClose: () => void;
}) {
  const { backdrop } = tuning;
  const { finalScale, width } = demoBackdropGeometry(backdrop, findNearLayer(tuning.nearLayerId).width);
  const setScale = (scale: number) => onChange({ ...backdrop, scale });
  const setOffset = (offsetY: number) => onChange({ ...backdrop, offsetY });
  return <aside className={s.panel} aria-label="背景缩放与偏移调节">
    <header className={s.panelHeader}>
      <strong>背景</strong>
      <button type="button" className={s.closeButton} aria-label="关闭背景调整面板" onClick={onClose}>×</button>
    </header>
    <div className={s.knobRow}>
      <ScaleKnob value={backdrop.scale} min={SCALE_MIN} max={SCALE_MAX} precision={SCALE_PRECISION} label="背景缩放倍率" onChange={setScale} />
      <div className={s.knobInfo}>
        <span>倍率 {backdrop.scale.toFixed(3)}</span>
        <span>最终 {finalScale.toFixed(3)}</span>
        <span>宽度 {width}</span>
        <div className={s.nudges}>
          <button type="button" aria-label={`倍率减少 ${SCALE_NUDGE}`} onClick={() => setScale(clampScale(backdrop.scale - SCALE_NUDGE))}>−{SCALE_NUDGE}</button>
          <button type="button" aria-label={`倍率增加 ${SCALE_NUDGE}`} onClick={() => setScale(clampScale(backdrop.scale + SCALE_NUDGE))}>+{SCALE_NUDGE}</button>
          <button type="button" onClick={() => setScale(DEFAULT_BACKDROP.scale)}>复位</button>
        </div>
      </div>
    </div>
    <div className={s.offsetRow}>
      <span>偏移 {backdrop.offsetY > 0 ? "+" : ""}{backdrop.offsetY}</span>
      <div className={s.nudges}>
        {OFFSET_STEPS.map((step) => <button key={step} type="button" aria-label={step < 0 ? `上移 ${-step}` : `下移 ${step}`} onClick={() => setOffset(backdrop.offsetY + step)}>
          {step < 0 ? `↑${-step}` : `↓${step}`}
        </button>)}
        <button type="button" onClick={() => setOffset(DEFAULT_BACKDROP.offsetY)}>复位</button>
      </div>
    </div>
    <button type="button" className={s.printButton} onClick={() => printScales(tuning)}>打印</button>
  </aside>;
}
