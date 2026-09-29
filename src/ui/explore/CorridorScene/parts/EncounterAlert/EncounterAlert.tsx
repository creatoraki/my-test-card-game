import type { CSSProperties } from "react";
import { ENCOUNTER_TIMING } from "../ShadowEncounter/encounterTiming";
import s from "./EncounterAlert.module.css";

/** 遇敌瞬间玩家头顶弹出的红色感叹号：竖条 + 圆点两块画出，不依赖字体字形。 */
export function EncounterAlert() {
  return <div className={s.slot} aria-hidden>
    <div className={s.mark} style={{ "--alert-out": `${ENCOUNTER_TIMING.alertOutMs}ms` } as CSSProperties}>
      <span className={s.bar} />
      <span className={s.dot} />
    </div>
  </div>;
}
