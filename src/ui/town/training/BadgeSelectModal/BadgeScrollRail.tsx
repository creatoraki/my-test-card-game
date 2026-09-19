import { useEffect, useRef, useState, type RefObject, type PointerEvent } from "react";
import s from "./BadgeScrollRail.module.css";

/** 滚轮、箭头和拖动共用真实列表 scrollTop；无溢出时不伪造可滚动状态。 */
export function BadgeScrollRail({ targetRef }: { targetRef: RefObject<HTMLDivElement> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ top: 0, max: 0, ratio: 1 });
  useEffect(() => {
    const list = targetRef.current;
    if (!list) return;
    const sync = () => setMetrics({ top: list.scrollTop, max: Math.max(0, list.scrollHeight - list.clientHeight),
      ratio: Math.min(1, list.clientHeight / Math.max(1, list.scrollHeight)) });
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(list);
    for (const child of list.children) observer.observe(child);
    list.addEventListener("scroll", sync, { passive: true });
    return () => { observer.disconnect(); list.removeEventListener("scroll", sync); };
  }, [targetRef]);

  const ratio = Math.max(.12, metrics.ratio);
  function seek(event: PointerEvent<HTMLDivElement>) {
    const list = targetRef.current;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!list || !rect || !metrics.max) return;
    const progress = ((event.clientY - rect.top) / rect.height - ratio / 2) / (1 - ratio);
    list.scrollTop = Math.max(0, Math.min(1, progress)) * metrics.max;
  }
  function scroll(direction: number) { targetRef.current?.scrollBy({ top: direction * 154, behavior: "smooth" }); }
  return <div className={s.rail} data-inactive={!metrics.max || undefined}>
    <button type="button" className={s.arrow} disabled={metrics.top <= 0} aria-label="向上滚动徽章" onClick={() => scroll(-1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 20 10-16 10 16-10-7Z" /></svg>
    </button>
    <div ref={trackRef} className={s.track} onPointerDown={event => {
      if (!metrics.max) return;
      event.currentTarget.setPointerCapture(event.pointerId); seek(event);
    }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) seek(event); }}
      onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
      <span className={s.thumb} style={{ height: `${ratio * 100}%`,
        top: `${metrics.max ? metrics.top / metrics.max * (1 - ratio) * 100 : 0}%` }} />
    </div>
    <button type="button" className={s.arrow} disabled={metrics.top >= metrics.max} aria-label="向下滚动徽章" onClick={() => scroll(1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 4 10 16L22 4l-10 7Z" /></svg>
    </button>
  </div>;
}
