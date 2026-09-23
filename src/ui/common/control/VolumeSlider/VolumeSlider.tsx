import type { CSSProperties } from "react";
import s from "./VolumeSlider.module.css";

interface Props {
  value: number; // 0 ~ 1
  onChange: (value: number) => void;
  // 松手/松键时触发一次。给调用方做「试听」这类只该在落定时发生的事, 拖动过程中不响。
  onCommit?: () => void;
  disabled?: boolean;
  label: string; // 无障碍名称(界面上的可见文字由调用方自己排)
}

// 通用音量滑块: 轨道填充比例经 --vs-fill 下发给 CSS, 右侧常驻百分比读数。
// 刻意不认识任何音频模块 —— 它只是个受控的 0~1 滑块。
export function VolumeSlider({ value, onChange, onCommit, disabled, label }: Props) {
  const percent = Math.round(value * 100);

  return (
    <div className={s.slider} data-disabled={disabled ? "" : undefined}>
      <input
        className={s.range}
        style={{ "--vs-fill": `${percent}%` } as CSSProperties}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(Number.parseFloat(event.target.value))}
        onPointerUp={() => onCommit?.()}
        onKeyUp={() => onCommit?.()}
      />
      <output className={s.readout}>{percent}%</output>
    </div>
  );
}
