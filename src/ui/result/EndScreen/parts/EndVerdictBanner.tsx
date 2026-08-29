import { cx } from "@/ui/common/cx";
import type { RunResult } from "@/store/runStore";
import s from "./EndVerdictBanner.module.css";

interface Props {
  result: RunResult;
  wiped: boolean;
}

const VERDICTS: Record<RunResult, { tone: string; label: string; subtitle: string }> = {
  won: {
    tone: "toneWon",
    label: "远征完成",
    subtitle: "目标达成，远征记录已封存。",
  },
  retreat: {
    tone: "toneRetreat",
    label: "安全撤离",
    subtitle: "及时收队，带回的物资已送抵据点。",
  },
  lost: {
    tone: "toneLost",
    label: "全员失联",
    subtitle: "队伍未能返回，投递口仍保全了部分物资。",
  },
};

export function EndVerdictBanner({ result, wiped }: Props) {
  const verdict = VERDICTS[result];

  return (
    <section className={cx(s["banner"], s[verdict.tone], wiped && s["isWiped"])} aria-label="任务结算">
      <div className={s["stamp"]} aria-hidden="true">结算</div>
      <div className={s["copy"]}>
        <span className={s["kicker"]}>任务结算</span>
        <strong>{verdict.label}</strong>
        <p>{verdict.subtitle}</p>
      </div>
    </section>
  );
}