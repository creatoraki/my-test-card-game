import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { energyTier } from "@/explore/session";
import type { NodeHistoryEntry } from "@/explore/types";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { endTiming } from "../endChoreo";
import s from "./EventDropBand.module.css";

const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

interface Props {
  history: NodeHistoryEntry[];
}

export function EventDropBand({ history }: Props) {
  const total = history.length;
  const [dropped, setDropped] = useState(() => (prefersReducedMotion() ? total : 0));
  const complete = dropped >= total;
  const timing = endTiming();
  const shift = -Math.max(0, dropped - timing.visibleSlices) * (timing.sliceH + 6);

  useEffect(() => {
    setDropped(prefersReducedMotion() ? total : 0);
    if (!total || prefersReducedMotion()) return;

    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setDropped((current) => {
          const next = Math.min(total, current + 1);
          if (next >= total && interval != null) window.clearInterval(interval);
          return next;
        });
      }, timing.dropStepMs);
    }, timing.feedStartMs);

    return () => {
      window.clearTimeout(start);
      if (interval != null) window.clearInterval(interval);
    };
  }, [timing.dropStepMs, timing.feedStartMs, total]);

  const showAll = () => setDropped(total);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    showAll();
  };
  const visible = history.slice(0, dropped);

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
          className={s["band-list"]}
          style={{ "--shift": shift } as CSSProperties}
        >
          {visible.map((entry, index) => (
            <BandSlice
              key={`${entry.round}-${entry.segment}-${entry.lane}-${entry.eventId}-${index}`}
              entry={entry}
              fresh={index === visible.length - 1}
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
      className={cx(s["slice"], fresh && s["is-fresh"])}
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