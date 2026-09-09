// ★ 挑战达成条 ★ —— 战斗胜利面板上，本场到期的挑战契约各占一条。
//
// 为什么非要有这条带子: 奖励本身已经躺进战利品盘了(物资)或者悄悄挂上了 HUD(小队增益),
// 但两者都说不出**「这批东西是那份两轮前接下的契约给的」**。
// 挑战是本作唯一跨轮的赌注 —— 收网的那一刻不给个明确回响, 玩家根本串不起因果。
//
// 数据源是 ExploreState.trialReport: 由 explore/session.settleTrials 在这一场战斗结算时写入,
// 每场战斗开头重置 ⇒ 这里永远只显示「刚刚」到期的那几份, 不需要额外的清理时机。

import type { CSSProperties } from "react";
import { useExploreStore } from "@/store/exploreStore";
import s from "./VictoryTrialBand.module.css";

export function VictoryTrialBand({ style }: { style?: CSSProperties }) {
  // ⚠ 选择器直接取那一列本身, 不在里面写 `?? []`: 每次调用返回一个新数组会让
  //   useSyncExternalStore 认为快照一直在变(无会话时尤其明显)。
  const report = useExploreStore((state) => state.session?.trialReport);
  if (!report?.length) return null;

  return (
    <section className={s["trial-band"]} style={style} aria-label="挑战达成">
      {report.map((entry, index) => (
        <div className={s["trial-row"]} key={`${entry.name}-${index}`}>
          <span className={s["trial-badge"]}>挑战达成</span>
          <div className={s["trial-copy"]}>
            <strong className={s["trial-name"]}>{entry.name}</strong>
            {entry.story && <p className={s["trial-story"]}>{entry.story}</p>}
            {entry.notes.length > 0 && (
              <ul className={s["trial-notes"]}>
                {entry.notes.map((note, noteIndex) => (
                  <li key={`${note}-${noteIndex}`}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export default VictoryTrialBand;
