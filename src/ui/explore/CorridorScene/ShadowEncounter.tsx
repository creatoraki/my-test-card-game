import { useEffect, useRef } from "react";
import { CORRIDOR } from "@/explore/corridor/types";
import { finishCorridorEncounter } from "@/store/exploreCorridor";
import { setTransitionOrigin } from "@/ui/app/transitionOrigin";
import s from "./ShadowEncounter.module.css";

export function ShadowEncounter({ x, final }: { x: number; final: boolean }) {
  const silhouette = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const rect = silhouette.current?.getBoundingClientRect();
      if (rect) setTransitionOrigin(rect.left + rect.width / 2, rect.top + rect.height / 2);
      finishCorridorEncounter();
    }, CORRIDOR.encounterMs);
    return () => window.clearTimeout(timer);
  }, []);
  return <>
    <div ref={silhouette} className={s.shadow} style={{ left: x, top: CORRIDOR.floorY }} aria-hidden>
      <div className={s.pool} />
      {[0, 1, 2, 3, 4].map((index) => <i className={s.tendril} key={index} style={{ left: 30 + index * 27, animationDelay: `${index * 75}ms` }} />)}
      <div className={s.figure}><span className={s.eyes} /></div>
      <div className={s.ripple} />
    </div>
    <div className={s.warning} role="status"><span>不明敌意</span><strong>{final ? "前路已被封锁" : "黑影正在苏醒"}</strong><p>准备迎战</p></div>
    <div className={s.flash} aria-hidden />
  </>;
}
