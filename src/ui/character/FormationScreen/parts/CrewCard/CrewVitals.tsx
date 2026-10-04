import { deckUpgradeCost } from "@/engine";
import { vitalsOf } from "@/store/town/characterStats";
import type { CharacterState } from "@/store/town/townStore";
import { ExperienceBar } from "@/ui/common/bar/ExperienceBar/ExperienceBar";
import { HpBar } from "@/ui/common/bar/HpBar/HpBar";
import { PollutionMeter } from "@/ui/common/bar/PollutionMeter/PollutionMeter";
import { cx } from "@/ui/common/shared/cx";
import s from "./CrewVitals.module.css";

/** 复用详情页的经验与血条材质，数值收进条内。 */
export function CrewVitals({ cs, detail = false }: { cs: CharacterState; detail?: boolean }) {
  const vitals = vitalsOf(cs);
  return (
    <div className={cx(s.panel, detail && s.detail)}>
      <ExperienceBar exp={cs.exp} cost={deckUpgradeCost(cs.deckLevel)} compact />
      <div className={s.vitals}>
        <HpBar {...vitals} flush animated={false} />
        {detail && <PollutionMeter value={cs.pollution} />}
      </div>
    </div>
  );
}