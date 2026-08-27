import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { energyTier } from "@/explore/session";
import type { NodeHistoryEntry } from "@/explore/types";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { endStepMs, endTiming } from "../endChoreo";
import s from "./EventDropBand.module.css";

const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

interface Props {
  history: NodeHistoryEntry[];
}

export function EventDropBand({ history }: Props) {
  const total = history.length;
  const timerRef = useRef<number | null>(null);
  const [dropped, setDropped] = useState(() => (prefersReducedMotion() ? total : 0));
  const complete = dropped >= total;
  const timing = endTiming();
  const stepMs = endStepMs(total);

  useEffect(() => {
    setDropped(prefersReducedMotion() ? total : 0);
    if (!total || prefersReducedMotion()) return;

    let cancelled = false;
    const schedule = (next: number, delay: number) => {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (cancelled) return;
        setDropped(next);
        if (next < total) schedule(next + 1, stepMs);
      }, delay);
    };

    schedule(1, timing.feedStartMs);

    return () => {
      cancelled = true;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [stepMs, timing.feedStartMs, total]);

  const showAll = () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setDropped(total);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    showAll();
  };
  const visible = history.slice(0, dropped).slice(-(timing.visibleSlices + 2)).reverse();

  return (
    <section
      className={cx(s["band"], complete && s["is-complete"])}
      aria-label="远征记录"
      role="button"
      tabIndex={0}
      onClick={showAll}
      onKeyDown={handleKeyDown}
    >
      <div className={s["band-counter"]}>
        <span>事件回放</span>
        <strong>远征记录</strong>
        <small>{Math.min(dropped, total)} / {total}</small>
      </div>
      <div className={s["band-window"]}>
        <div
          key={dropped}
          className={s["band-list"]}
          style={{
            "--slice-drop": `${timing.sliceDropMs}ms`,
            "--slice-h": `${timing.sliceH}px`,
          } as CSSProperties}
        >
          {visible.map((entry, index) => (
            <BandSlice
              key={`${entry.round}-${entry.segment}-${entry.lane}-${entry.eventId}-${index}`}
              entry={entry}
              fresh={index === 0}
            />
          ))}
        </div>
        {!total && <p className={s["band-empty"]}>本趟没有已结算节点</p>}
      </div>
    </section>
  );
}

function BandSlice({ entry, fresh }: { entry: NodeHistoryEntry; fresh: boolean }) {
  const tierColor = energyTier(entry.energyAfter).color;
  const energyDown = entry.energyAfter < entry.energyBefore;

  return (
    <article
      className={cx(s["slice"], s[`k-${entry.eventKind ?? "unknown"}`], fresh && s["is-fresh"])}
      style={{ "--tier-color": tierColor } as CSSProperties}
    >
      <div className={s["slice-meta"]}>
        <span className={s["slice-mark"]}>R{entry.round}-{entry.segment + 1}</span>
        <span className={s["slice-lane"]}>{ENTRY_LABELS[entry.lane] ?? entry.lane + 1}通道</span>
      </div>
      <span className={s["slice-copy"]}>
        <strong>{entry.eventTitle}</strong>
        <small>{entry.note}</small>
      </span>
      <span className={cx(s["slice-energy"], energyDown ? s["is-down"] : s["is-flat"])}>
        {entry.energyBefore} → {entry.energyAfter}
      </span>
    </article>
  );
}