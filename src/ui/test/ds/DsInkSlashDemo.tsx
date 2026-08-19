// ★ ds · 墨韵·剑意斩 demo —— 水墨风斩击特效展示页(TestScreen 的 ds 页签)★
//
// 舞台中央立一根纯 CSS 木桩当受击目标, DsInkSlashFx 以 (50%, 50%) 铺在舞台中心
// (= 木桩中点), 每次点击"执笔·挥斩"用 key 重挂载重播; 倍速只改 --fx-rate 一个
// CSS 变量, 特效组件的 timing() 会整体缩放全部动画(不改任何动画代码)。
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DsInkSlashFx, INK_SLASH_PRESET } from "./DsInkSlashFx";
import s from "./DsInkSlashDemo.module.css";

const RATES = [0.5, 1, 2] as const;

// 四幕说明(与 DsInkSlashFx 的注释时间轴一一对应)
const ACTS = [
  { dot: s.actInk, name: "蓄意", time: "0 – 620ms", desc: "纸面微光铺开, 中心墨晕凝聚, 笔锋未动墨已行" },
  { dot: s.actInk, name: "横扫", time: "620 – 1120ms", desc: "湿墨晕 + 浓墨剑身 + 枯笔飞白, 沿 42° 斜上挑斩" },
  { dot: s.actCinnabar, name: "爆墨", time: "1400ms", desc: "纸裂白闪 · 墨环涟漪 · 墨点飞溅 · 朱印落款" },
  { dot: s.actPaper, name: "收锋", time: "1400 – 2550ms", desc: "剑痕墨迹洇开渐干, 飞溅墨点沉定成渍" },
] as const;

export function DsInkSlashDemo() {
  // seq 每 +1 强制重挂载特效层, 让整套动画从头播
  const [seq, setSeq] = useState(0);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  // 播放状态按 (hold / 倍速) 自动复位; 切倍速/重播都会重建计时
  useEffect(() => {
    if (!playing) return;
    timerRef.current = window.setTimeout(
      () => setPlaying(false),
      INK_SLASH_PRESET.hold / rate,
    );
    return () => window.clearTimeout(timerRef.current);
  }, [playing, rate, seq]);

  const strike = () => {
    setSeq((n) => n + 1);
    setPlaying(true);
  };

  return (
    <div className={s.root}>
      <header className={s.header}>
        <div className={s.headerTitle}>
          <span className={s.kicker}>DS ARCHIVE / FX SHEET 02</span>
          <h1>墨韵 · 剑意斩</h1>
          <p className={s.subtitle}>
            水墨留白风的程序化斩击特效 —— 宣纸微光、浓墨剑身、枯笔飞白、爆墨飞溅与朱印落款，
            蓄意、横扫、爆墨、收锋四幕一气呵成；与刀光斩、血光斩刻意拉开风味。
          </p>
        </div>
        <div className={s.headerStatus}>
          <span className={s.statusStamp}>PURE CSS FX</span>
          <span className={s.statusCount}>0 SPRITES · 4 ACTS</span>
        </div>
      </header>

      <main className={s.main}>
        {/* 舞台: 木桩受击目标 + 特效层 */}
        <div className={s.stage} style={{ "--fx-rate": rate } as CSSProperties}>
          <div className={s.stageShadow} aria-hidden="true" />
          <div className={s.stagePost} aria-hidden="true" />
          <div className={s.fxLayer} key={seq} aria-hidden>
            <DsInkSlashFx preset={INK_SLASH_PRESET} />
          </div>
          <span className={s.stageTag}>墨 · 受击木桩</span>
        </div>

        {/* 控制台: 挥斩 / 倍速 / 状态 / 幕次 */}
        <aside className={s.panel}>
          <button type="button" className={s.strikeBtn} onClick={strike}>
            <span className={s.strikeBrush} aria-hidden="true" />
            执笔 · 挥斩
          </button>

          <div className={s.rateGroup} role="group" aria-label="播放倍速">
            <span className={s.rateLabel}>倍速</span>
            {RATES.map((r) => (
              <button
                key={r}
                type="button"
                className={rate === r ? s.rateActive : undefined}
                aria-pressed={rate === r}
                onClick={() => setRate(r)}
              >
                {r}×
              </button>
            ))}
          </div>

          <p className={s.status} aria-live="polite">
            {playing ? (
              <span className={s.statusLive}>横扫 → 爆墨 → 收锋</span>
            ) : (
              "墨已研好 · 落笔即斩"
            )}
          </p>

          <ul className={s.acts} aria-label="特效四幕时间轴">
            {ACTS.map((act) => (
              <li key={act.name} className={s.actRow}>
                <span className={`${s.actDot} ${act.dot}`} aria-hidden="true" />
                <span className={s.actName}>{act.name}</span>
                <span className={s.actTime}>{act.time}</span>
                <span className={s.actDesc}>{act.desc}</span>
              </li>
            ))}
          </ul>
        </aside>
      </main>

      <footer className={s.footer}>
        <span className={s.footerNote}>ARCHIVE STATUS</span>
        <strong className={s.footerText}>
          纯 CSS 关键帧 · 无序列帧素材 · 倍速由 --fx-rate 整体缩放
        </strong>
        <span className={s.footerGlyph} aria-hidden="true">墨</span>
      </footer>
    </div>
  );
}
