import { useRef, type KeyboardEvent, type PointerEvent, type WheelEvent } from "react";
import s from "./ScaleKnob.module.css";

/** 指针转角范围：-135° ~ 135°。 */
const SWEEP = 135;
/** 上下拖动 240px 走完全程。 */
const DRAG_RANGE = 240;
const STEP = 0.01;

/**
 * 对数刻度旋钮：上下拖动或滚轮调节，↑/↓ 键微调，双击复位到 1 倍。
 * 左右方向键留给角色移动，不在这里处理。
 */
export function ScaleKnob({ value, min, max, onChange, label }: {
  value: number; min: number; max: number; onChange: (value: number) => void; label: string;
}) {
  const drag = useRef<{ y: number; t: number } | null>(null);
  const span = Math.log(max / min);
  const toT = (v: number) => Math.log(v / min) / span;
  const fromT = (t: number) => {
    const raw = min * Math.exp(Math.max(0, Math.min(1, t)) * span);
    return Math.round(raw / STEP) * STEP;
  };
  const t = toT(value);
  const angle = (t * 2 - 1) * SWEEP;

  const down = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { y: event.clientY, t };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    onChange(fromT(drag.current.t + (drag.current.y - event.clientY) / DRAG_RANGE));
  };
  const up = () => { drag.current = null; };
  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    onChange(fromT(t - Math.sign(event.deltaY) / 100));
  };
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    onChange(Math.max(min, Math.min(max, Math.round((value + (event.key === "ArrowUp" ? STEP : -STEP)) / STEP) * STEP)));
  };

  return <div
    className={s.knob}
    role="slider"
    tabIndex={0}
    aria-label={label}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-valuetext={`${value.toFixed(2)} 倍`}
    onPointerDown={down}
    onPointerMove={move}
    onPointerUp={up}
    onPointerCancel={up}
    onWheel={wheel}
    onKeyDown={key}
    onDoubleClick={() => onChange(1)}
  >
    <svg className={s.track} viewBox="0 0 100 100" aria-hidden>
      <circle className={s.groove} cx="50" cy="50" r="44" pathLength="360" strokeDasharray={`${SWEEP * 2} 360`} transform={`rotate(${90 + (180 - SWEEP)} 50 50)`} />
      <circle className={s.fill} cx="50" cy="50" r="44" pathLength="360" strokeDasharray={`${t * SWEEP * 2} 360`} transform={`rotate(${90 + (180 - SWEEP)} 50 50)`} />
    </svg>
    <div className={s.dial} style={{ transform: `rotate(${angle}deg)` }}>
      <span className={s.pointer} />
    </div>
    <span className={s.value}>{value.toFixed(2)}</span>
  </div>;
}
