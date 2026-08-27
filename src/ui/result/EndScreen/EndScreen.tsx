// 远征结算 —— 通关 / 撤离 / 团灭三种收场共用一页。
// 主角是「远征记录」: session.history 每段一条(落在哪个终点、能量掉到多少),
// 一趟远征结束时那一列就是完整的故事, 比任何汇总数字都更值得看。

import { getMap } from "@/data";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import { EXPEDITION_RESULT_BG_ART } from "@/ui/art/sceneArt";
import { cx } from "@/ui/common/cx";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { EventDropBand } from "./parts/EventDropBand";
import { EndHaulPanel } from "./parts/EndHaulPanel";
import { EndPartyRoster } from "./parts/EndPartyRoster";
import { EndTrophyRail } from "./parts/EndTrophyRail";
import { buildEndSummary } from "./endSummary";
import s from "./EndScreen.module.css";

const TITLES = {
  won: { title: "远征完成", kicker: "远征终端 / 最终报告", note: "回收总控已停机，这一层安静下来了。" },
  retreat: { title: "已撤离", kicker: "远征终端 / 撤离报告", note: "带着已经装入中转仓的收获，平安返回。" },
  lost: { title: "远征中断", kicker: "远征终端 / 事故报告", note: "全队失去意识，未投递物资遗失。" },
} as const;

export function EndScreen() {
  const characters = useTownStore((s) => s.characters);
  const lastResult = useRunStore((s) => s.lastResult);
  const mapId = useRunStore((s) => s.mapId);
  const backToTown = useRunStore((s) => s.backToTown);
  const session = useExploreStore((s) => s.session);

  const result = lastResult ?? "lost";
  const { title, kicker, note } = TITLES[result];
  const map = mapId ? getMap(mapId) : null;
  const summary = buildEndSummary(session, characters, result);

  return (
    <StageCanvas
      viewportClassName={s["viewport"]}
      className={cx(s["screen"], s["end-stage"], summary.wiped && s["is-wiped"])}
      data-end-stage=""
      data-explore-stage=""
    >
      <img className={s["end-bg"]} src={EXPEDITION_RESULT_BG_ART} alt="" draggable={false} />
      <div className={s["end-veil"]} aria-hidden="true" />

      <header className={s["end-header"]}>
        <div>
          <span className={s["end-kicker"]}>{kicker}</span>
          <h1>{title}</h1>
          <p>{note}</p>
        </div>
        <div className={s["end-map"]}>
          <span>目标层</span>
          <strong>{map?.name ?? "未知区域"}</strong>
        </div>
      </header>

      <main className={s["end-content"]}>
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

      <button className={cx(s["end-action"], s["expl-btn"], s["is-primary"])} onClick={backToTown}>
        <span aria-hidden="true">←</span>
        返回城镇
      </button>
    </StageCanvas>
  );
}
