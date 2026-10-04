import { deckUpgradeCost } from "@/engine";
import { vitalsOf } from "@/store/town/characterStats";
import type { CharacterState } from "@/store/town/townStore";
import { ExperienceBar } from "@/ui/common/bar/ExperienceBar/ExperienceBar";
import { HpBar } from "@/ui/common/bar/HpBar/HpBar";
import s from "./CrewVitals.module.css";

/** 复用详情页的经验与血条材质，数值收进条内。 */
export function CrewVitals({ cs }: { cs: CharacterState }) {
  const vitals = vitalsOf(cs);
  return (
    <div className={s.panel}>
      <ExperienceBar exp={cs.exp} cost={deckUpgradeCost(cs.deckLevel)} compact />
      <HpBar {...vitals} flush animated={false} />
    </div>
  );
}