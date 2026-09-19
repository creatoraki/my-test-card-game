import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AttackArtsFx, type AttackArt } from "@/ui/battle/fx/AttackArtsFx";
import { BladeSlashFx } from "@/ui/battle/fx/BladeSlashFx";
import { ANIM } from "@/ui/battle/animations";
import { enemyArt } from "@/ui/art/enemyArt";
import s from "./AttackArtsDemo.module.css";

const BLADE = ANIM["blade-slash"];
const TARGET = enemyArt("scrap-bot");

export function AttackArtsDemo({ art }: { art?: AttackArt }) {
  const [sequence, setSequence] = useState(0);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(true);
  const [showTarget, setShowTarget] = useState(true);
  const [scale, setScale] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const duration = art?.durationMs ?? BLADE.hold;
  const impact = art?.impactMs ?? BLADE.proc!.impactMs;
  const color = art?.color ?? BLADE.color;

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(entry.contentRect.width / 1200, entry.contentRect.height / 900));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!loop) return;
    const timer = window.setTimeout(() => setSequence(n => n + 1), duration / rate + 800);
    return () => window.clearTimeout(timer);
  }, [loop, sequence, duration, rate]);

  return (
    <div className={s.root} style={{ "--art-color": color } as CSSProperties}>
      <header className={s.header}>
        <div>
          <p className={s.category}>{art?.category ?? "原版对照"} · 攻击特效</p>
          <h1>{art?.name ?? "刀光斩"}</h1>
          <p className={s.description}>{art?.description ?? "原版刀光斩：斜向刀光、粒子回流、沿刃爆裂。作为这批特效的视觉对照。"}</p>
        </div>
        <div className={s.readout}>
          <span>命中 {(impact / 1000).toFixed(2)} 秒</span>
          <span>全程 {(duration / 1000).toFixed(2)} 秒</span>
        </div>
      </header>
      <div className={s.viewport} ref={viewport}>
        <div className={s.stage} style={{ transform: `translate(-50%, -50%) scale(${scale})`, "--fx-rate": rate } as CSSProperties}>
          <div className={s.floor} />
          <div className={s.reticle} />
          <div key={`${sequence}-${rate}`} className={s.playback}
            style={{ "--impact-delay": `${impact / rate}ms`, "--reaction-duration": `${360 / rate}ms` } as CSSProperties}>
            {showTarget && TARGET ? <img className={s.target} src={TARGET.src} alt="受击演示用废品机器人" /> : null}
            {art ? <AttackArtsFx art={art} rate={rate} /> : <BladeSlashFx preset={BLADE.proc!} />}
            {showTarget ? <span className={s.hit}>命中</span> : null}
          </div>
        </div>
        <span className={s.stageLabel}>目标中心演示 · {showTarget ? "受击反馈开启" : "纯特效观察"}</span>
      </div>
      <footer className={s.controls}>
        <button type="button" className={s.replay} onClick={() => setSequence(n => n + 1)}>重新播放</button>
        <button type="button" aria-pressed={loop} onClick={() => setLoop(v => !v)}>循环播放：{loop ? "开" : "关"}</button>
        <button type="button" aria-pressed={showTarget} onClick={() => { setShowTarget(v => !v); setSequence(n => n + 1); }}>演示目标：{showTarget ? "显示" : "隐藏"}</button>
        <label className={s.speed}>播放速度
          <select value={rate} onChange={event => { setRate(Number(event.target.value)); setSequence(n => n + 1); }}>
            <option value={0.25}>四分之一速</option>
            <option value={0.5}>半速</option>
            <option value={1}>正常速度</option>
            <option value={1.5}>一点五倍速</option>
          </select>
        </label>
      </footer>
    </div>
  );
}
