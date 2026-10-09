import { useRef, type KeyboardEvent, type PointerEvent, type WheelEvent } from "react";
import s from "./ScaleKnob.module.css";

/** 指针转角范围：-135° ~ 135°。 */
const SWEEP = 135;
/** 上下拖动 240px 走完全程；按住 Shift 时放慢 10 倍做精细调节。 */
const DRAG_RANGE = 240;
const FINE_FACTOR = 10;
/** 滚轮每格走全程的 1%，Shift 时 0.1%。 */
const WHEEL_STEP = 0.01;

/**
 * 对数刻度旋钮：上下拖动或滚轮调节（按住 Shift 精细调节），↑/↓ 键按 precision 微调，双击复位到 1 倍。
 * 左右方向键留给角色移动，不在这里处理。
 */
export function ScaleKnob({ value, min, max, precision, onChange, label }: {
  value: number; min: number; max: number; precision: number; onChange: (value: number) => void; label: string;
}) {
  const drag = useRef<{ y: number; t: number; fine: boolean } | null>(null);
  const span = Math.log(max / min);
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v / precision) * precision));
  const toT = (v: number) => Math.log(v / min) / span;
  const fromT = (t: number) => clamp(min * Math.exp(Math.max(0, Math.min(1, t)) * span));
  const t = toT(value);
  const angle = (t * 2 - 1) * SWEEP;

  const down = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { y: event.clientY, t, fine: event.shiftKey };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    // 拖动途中切换 Shift 时以当前位置为新起点，避免数值跳变。
    if (current.fine !== event.shiftKey) {
      drag.current = { y: event.clientY, t, fine: event.shiftKey };
      return;
    }
    const range = DRAG_RANGE * (current.fine ? FINE_FACTOR : 1);
    onChange(fromT(current.t + (current.y - event.clientY) / range));
  };
  const up = () => { drag.current = null; };
  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    const step = WHEEL_STEP / (event.shiftKey ? FINE_FACTOR : 1);
    onChange(fromT(t - Math.sign(event.deltaY) * step));
  };
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    onChange(clamp(value + (event.key === "ArrowUp" ? precision : -precision)));
  };

  return <div
    className={s.knob}
    role="slider"
    tabIndex={0}
    aria-label={label}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-valuetext={`${value.toFixed(3)} 倍`}
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
    <span className={s.value}>{value.toFixed(3)}</span>
  </div>;
}
