import type { CSSProperties } from "react";
import { cx } from "@/ui/common/cx";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { endExitTiming, endTiming } from "../endChoreo";
import type { EndTrophy } from "../endSummary";
import s from "./EndTrophyRail.module.css";

interface Props {
  trophies: EndTrophy[];
  wiped: boolean;
}

export function EndTrophyRail({ trophies, wiped }: Props) {
  const timing = endTiming();

  return (
    <section
      className={s["trophies"]}
      aria-label="远征统计"
      style={{ "--trophy-header-delay": `${timing.headerMs}ms` } as CSSProperties}
    >
      <header className={s["trophies-header"]}>
        <div>
          <span>远征统计</span>
          <h2>战果记录</h2>
        </div>
      </header>
      <div className={s["trophy-grid"]}>
        {trophies.map((trophy, index) => (
          <TrophyCell
            key={trophy.key}
            trophy={trophy}
            index={index}
            total={trophies.length}
            wiped={wiped}
          />
        ))}
      </div>
    </section>
  );
}

function TrophyCell({
  trophy,
  index,
  total,
  wiped,
}: {
  trophy: EndTrophy;
  index: number;
  total: number;
  wiped: boolean;
}) {
  const timing = endTiming();
  const exitTiming = endExitTiming();
  const shown = useCountUp(
    trophy.value,
    timing.headerMs + timing.trophyStagger * index,
    timing.trophyCountMs,
  );
  const lostScore = wiped && trophy.key === "loot";

  return (
    <article
      className={cx(s["trophy"], s[trophy.tone], lostScore && s["is-lost"])}
      style={
        {
          "--trophy-delay": `${timing.headerMs + timing.trophyStagger * index}ms`,
          "--trophy-out-delay": `${exitTiming.trophyOut + (total - 1 - index) * exitTiming.trophyOutStagger}ms`,
        } as CSSProperties
      }
    >
      <span className={s["trophy-icon"]} aria-hidden="true">{trophy.icon}</span>
      <div className={s["trophy-copy"]}>
        <span className={s["trophy-label"]}>{trophy.label}</span>
        <strong>{Math.round(shown).toLocaleString("zh-CN")}</strong>
        <small>{trophy.unit}</small>
        {trophy.caption && <em>{trophy.caption}</em>}
      </div>
    </article>
  );
}