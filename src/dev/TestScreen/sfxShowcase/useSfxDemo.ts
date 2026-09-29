import { useCallback, useEffect, useRef, useState } from "react";
import { playSfx } from "@/ui/audio";
import { ANIM, type HitFx } from "@/ui/battle/choreo/animations";
import { playDemoPart, preloadBakedDemos, type DemoAnim, type DemoMode } from "./sfxDemos";

export interface DemoPlayback {
  hit: HitFx | null;
  /** 正在播放的 demo: `${mode}:${anim}`。 */
  active: string | null;
  play: (mode: DemoMode, anim: DemoAnim) => void;
}

/** 试听调度: 挂载命中特效 + 施放段立即起播 + 爆点段在 impactMs 起播, 全部按倍速缩放。 */
export function useSfxDemo(rate: number, layerHitSample: boolean): DemoPlayback {
  const [hit, setHit] = useState<HitFx | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    preloadBakedDemos();
    return clearTimers;
  }, []);

  const play = useCallback((mode: DemoMode, anim: DemoAnim) => {
    clearTimers();
    const preset = ANIM[anim];
    const impactMs = preset.proc?.impactMs ?? 0;
    seq.current += 1;
    setHit({ anim, floats: [{ text: "128", tone: "dmg", delayMs: 0 }], seq: seq.current });
    setActive(`${mode}:${anim}`);
    playDemoPart(mode, anim, "cast", rate);
    timers.current.push(window.setTimeout(() => {
      playDemoPart(mode, anim, "hit", rate);
      if (layerHitSample) playSfx("hit", { volume: 0.6 });
    }, impactMs / rate));
    timers.current.push(window.setTimeout(() => {
      setHit(null);
      setActive(null);
    }, preset.hold / rate));
  }, [layerHitSample, rate]);

  return { hit, active, play };
}
