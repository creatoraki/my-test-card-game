// 远征结算 —— 通关 / 撤离 / 团灭三种收场共用一页。
// 主角是「远征记录」: session.history 同时记录节点结算与轮末遭遇战,
// 一趟远征结束时那一列就是完整的故事, 比任何汇总数字都更值得看。

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import { EXPEDITION_RESULT_BG_ART } from "@/ui/art/sceneArt";
import { cx } from "@/ui/common/cx";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { EventDropBand } from "./parts/EventDropBand";
import { EndHaulPanel } from "./parts/EndHaulPanel";
import { EndPartyRoster } from "./parts/EndPartyRoster";
import { EndTrophyRail } from "./parts/EndTrophyRail";
import { EndVerdictBanner } from "./parts/EndVerdictBanner";
import { END_EXIT_MS, endExitTiming, endTiming } from "./endChoreo";
import { buildEndSummary } from "./endSummary";
import s from "./EndScreen.module.css";

export function EndScreen() {
  const characters = useTownStore((s) => s.characters);
  const lastResult = useRunStore((s) => s.lastResult);
  const beginAscent = useRunStore((s) => s.beginAscent);
  const session = useExploreStore((s) => s.session);
  const [leaving, setLeaving] = useState(false);
  const backTimerRef = useRef<number | null>(null);

  const result = lastResult ?? "lost";
  const summary = buildEndSummary(session, characters, result);
  const timing = endTiming();
  const exitTiming = endExitTiming();
  const exitMs = prefersReducedMotion() ? 0 : END_EXIT_MS;

  useEffect(() => {
    return () => {
      if (backTimerRef.current != null) window.clearTimeout(backTimerRef.current);
    };
  }, []);

  const handleBack = () => {
    if (leaving) return;
    setLeaving(true);
    if (exitMs === 0) {
      beginAscent();
      return;
    }
    backTimerRef.current = window.setTimeout(() => {
      backTimerRef.current = null;
      beginAscent();
    }, exitMs);
  };

  const choreoStyle = {
    "--end-bg-ms": `${timing.bgMs}ms`,
    "--end-verdict-delay": `${timing.verdictMs}ms`,
    "--end-header-delay": `${timing.headerMs}ms`,
    "--end-roster-delay": `${timing.rosterStartMs}ms`,
    "--end-haul-delay": `${timing.haulStartMs}ms`,
    "--end-band-delay": `${timing.bandStartMs}ms`,
    "--end-action-delay": `${timing.actionMs}ms`,
    "--end-action-out-delay": `${exitTiming.actionOut}ms`,
    "--end-band-out-delay": `${exitTiming.bandOut}ms`,
    "--end-haul-out-delay": `${exitTiming.haulOut}ms`,
    "--end-roster-out-delay": `${exitTiming.rosterOut}ms`,
    "--end-trophy-out-delay": `${exitTiming.trophyOut}ms`,
    "--end-verdict-out-delay": `${exitTiming.verdictOut}ms`,
    "--end-bg-out-delay": `${exitTiming.bgOut}ms`,
  } as CSSProperties;

  return (
    <StageCanvas
      viewportClassName={s["viewport"]}
      className={cx(s["screen"], s["end-stage"], summary.wiped && s["is-wiped"])}
      style={choreoStyle}
      data-end-phase={leaving ? "leaving" : "in"}
      data-end-stage=""
      data-explore-stage=""
    >
      <img className={s["end-bg"]} src={EXPEDITION_RESULT_BG_ART} alt="" draggable={false} />
      <div className={s["end-veil"]} aria-hidden="true" />

      <main className={s["end-content"]}>
        <div className={s["end-verdict-slot"]}>
          <EndVerdictBanner result={result} wiped={summary.wiped} />
        </div>
        <div className={s["end-trophy-slot"]}>
          <EndTrophyRail trophies={summary.trophies} wiped={summary.wiped} />
        </div>
        <div className={s["end-haul-slot"]}>
          <EndHaulPanel haul={summary.haul} salvageValue={summary.salvageValue} wiped={summary.wiped} />
        </div>
        <div className={s["end-roster-slot"]}>
          <EndPartyRoster members={summary.roster} wiped={summary.wiped} />
        </div>
        <div className={s["end-band-slot"]}>
          <EventDropBand history={session?.history ?? []} />
        </div>
      </main>

      <button
        className={cx(s["end-action"], s["expl-btn"], s["end-action-gold"])}
        onClick={handleBack}
        disabled={leaving}
      >
        <span aria-hidden="true">←</span>
        返回城镇
      </button>
    </StageCanvas>
  );
}
