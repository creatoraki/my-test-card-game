import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { energyTier } from "@/explore/session";
import type { NodeHistoryEntry } from "@/explore/types";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { endTiming } from "../endChoreo";
import s from "./EventDropFeed.module.css";

const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

interface Props {
  history: NodeHistoryEntry[];
}

export function EventDropFeed({ history }: Props) {
  const total = history.length;
  const [dropped, setDropped] = useState(() => (prefersReducedMotion() ? total : 0));
  const feedWindowRef = useRef<HTMLDivElement>(null);
  const complete = dropped >= total;

  useEffect(() => {
    const timing = endTiming();
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
  }, [total]);

  useEffect(() => {
    if (complete) feedWindowRef.current?.scrollTo({ top: 0 });
  }, [complete]);

  const showAll = () => setDropped(total);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    showAll();
  };
  const visible = history.slice(0, dropped).reverse();

  return (
    <section
      className={s["feed"]}
      aria-label="远征记录"
      role="button"
      tabIndex={0}
      onClick={showAll}
      onKeyDown={handleKeyDown}
    >
      <header className={s["feed-header"]}>
        <div>
          <span>事件回放</span>
          <h2>远征记录</h2>
        </div>
        <strong>{Math.min(dropped, total)} / {total}</strong>
      </header>
      <div ref={feedWindowRef} className={cx(s["feed-window"], complete && s["is-complete"])}>
        <div key={dropped} className={s["feed-stack"]}>
          {visible.map((entry, index) => (
            <FeedEntry
              key={`${entry.round}-${entry.segment}-${entry.lane}-${entry.eventId}-${index}`}
              entry={entry}
              fresh={index === 0}
            />
          ))}
        </div>
        {!total && <p className={s["feed-empty"]}>本趟没有已结算节点</p>}
      </div>
    </section>
  );
}

function FeedEntry({ entry, fresh }: { entry: NodeHistoryEntry; fresh: boolean }) {
  const tierColor = energyTier(entry.energyAfter).color;
  return (
    <article
      className={cx(s["feed-entry"], fresh && s["is-fresh"])}
      style={{ "--tier-color": tierColor } as CSSProperties}
    >
      <span className={s["feed-mark"]}>R{entry.round}-{entry.segment + 1}</span>
      <span className={s["feed-lane"]}>{ENTRY_LABELS[entry.lane] ?? entry.lane + 1}通道</span>
      <span className={s["feed-event"]}>
        <strong>{entry.eventTitle}</strong>
        <small>{entry.note}</small>
      </span>
      <span className={cx(s["feed-energy"], entry.energyAfter < entry.energyBefore ? s["is-down"] : s["is-flat"])}>
        {entry.energyBefore} → {entry.energyAfter}
      </span>
    </article>
  );
}