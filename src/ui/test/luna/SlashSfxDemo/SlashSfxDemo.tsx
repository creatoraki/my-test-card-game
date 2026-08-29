import { useState } from "react";
import { playSfx } from "@/ui/audio/sfx";
import { SlashSfxFx } from "./SlashSfxFx";
import s from "./SlashSfxDemo.module.css";

const PLAYBACK_STATES = ["待机", "双斩推进", "落点命中"] as const;
const IMPACT_MS = 230;
const PLAYBACK_MS = 560;

export function SlashSfxDemo() {
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [sequence, setSequence] = useState(0);
  const isPlaying = playbackIndex > 0;

  const playSlash = () => {
    if (isPlaying) return;
    setPlaybackIndex(1);
    setSequence((value) => value + 1);
    playSfx("slash", { volume: 0.9 });
    window.setTimeout(() => {
      setPlaybackIndex(2);
      playSfx("hit", { volume: 0.78 });
    }, IMPACT_MS);
    window.setTimeout(() => setPlaybackIndex(0), PLAYBACK_MS);
  };

  return (
    <section className={s.root} data-playback={PLAYBACK_STATES[playbackIndex]}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>音效试验台</p>
          <h1>斩击</h1>
          <p className={s.description}>短促双斩紧跟采样，第二道刀光落点接上命中声。</p>
        </div>
        <p className={s.duration}>0.56 秒</p>
      </header>

      <div className={s.stage} aria-live="polite">
        <div className={s.target} aria-hidden="true">
          <span className={s.targetCore} />
          <span className={s.targetLine} />
          <span className={s.targetLine} />
        </div>
        {isPlaying ? <div className={s.fxFrame} aria-hidden="true"><SlashSfxFx key={sequence} /></div> : null}
        <div className={s.status}>
          <span>播放状态</span>
          <strong>{PLAYBACK_STATES[playbackIndex]}</strong>
        </div>
      </div>

      <div className={s.controls}>
        <button type="button" className={s.playButton} onClick={playSlash} disabled={isPlaying}>
          <span className={s.playIcon} aria-hidden="true" />
          播放斩击音效
        </button>
        <p>点击后可重复试听</p>
      </div>
    </section>
  );
}