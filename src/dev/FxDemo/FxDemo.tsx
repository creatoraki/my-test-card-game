import { useEffect, useRef, useState, type CSSProperties } from "react";
import { enemyArt } from "@/ui/art/battle/enemyArt";
import type { DemoFx } from "./arrowDemos";
import s from "./FxDemo.module.css";

const TARGET = enemyArt("scrap-bot");
const STAGE_W = 1200;
const STAGE_H = 900;
const RATES = [
  { value: 0.25, label: "四分之一速" },
  { value: 0.5, label: "半速" },
  { value: 1, label: "正常速度" },
  { value: 1.5, label: "一点五倍速" },
] as const;

// 单个攻击特效的演示台: 固定 1200×900 设计舞台按视口等比缩放, 原点 = 目标中心。
// 重播靠换 key 重挂载; 倍速经 --fx-rate 下发给特效(与战斗内同一语义)。
export function FxDemo({ fx }: { fx: DemoFx }) {
  const [sequence, setSequence] = useState(0);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(true);
  const [showTarget, setShowTarget] = useState(true);
  const [scale, setScale] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const { durationMs, impactMs, color } = fx;

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(entry.contentRect.width / STAGE_W, entry.contentRect.height / STAGE_H));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!loop) return;
    const timer = window.setTimeout(() => setSequence((n) => n + 1), durationMs / rate + 800);
    return () => window.clearTimeout(timer);
  }, [loop, sequence, durationMs, rate]);

  const replay = () => setSequence((n) => n + 1);

  return (
    <div className={s.root} style={{ "--art-color": color } as CSSProperties}>
      <header className={s.header}>
        <div>
          <p className={s.category}>{fx.category}</p>
          <h1 className={s.title}>{fx.name}</h1>
          <p className={s.description}>{fx.description}</p>
        </div>
        <div className={s.readout}>
          <span>命中 {(impactMs / 1000).toFixed(2)} 秒</span>
          <span>全程 {(durationMs / 1000).toFixed(2)} 秒</span>
        </div>
      </header>

      <ol className={s.beats}>
        {fx.beats.map(([time, text]) => (
          <li key={time}>
            <span className={s.beatTime}>{(time / 1000).toFixed(2)} 秒</span>
            {text}
          </li>
        ))}
      </ol>

      <div className={s.viewport} ref={viewport}>
        <div
          className={s.stage}
          style={{ transform: `translate(-50%, -50%) scale(${scale})`, "--fx-rate": rate } as CSSProperties}
        >
          <div className={s.floor} />
          <div className={s.reticle} />
          <div
            key={`${sequence}-${rate}-${showTarget}`}
            className={s.playback}
            style={{
              "--impact-delay": `${impactMs / rate}ms`,
              "--reaction-duration": `${360 / rate}ms`,
            } as CSSProperties}
          >
            {showTarget && TARGET ? <img className={s.target} src={TARGET.src} alt="受击演示用废品机器人" /> : null}
            {fx.render()}
            {showTarget ? <span className={s.hit}>命中</span> : null}
          </div>
        </div>
        <span className={s.stageLabel}>目标中心演示 · {showTarget ? "受击反馈开启" : "纯特效观察"}</span>
      </div>

      <footer className={s.controls}>
        <button type="button" className={s.replay} onClick={replay}>重新播放</button>
        <button type="button" aria-pressed={loop} onClick={() => setLoop((v) => !v)}>
          循环播放：{loop ? "开" : "关"}
        </button>
        <button type="button" aria-pressed={showTarget} onClick={() => setShowTarget((v) => !v)}>
          演示目标：{showTarget ? "显示" : "隐藏"}
        </button>
        <label className={s.speed}>
          播放速度
          <select value={rate} onChange={(event) => setRate(Number(event.target.value))}>
            {RATES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </footer>
    </div>
  );
}
