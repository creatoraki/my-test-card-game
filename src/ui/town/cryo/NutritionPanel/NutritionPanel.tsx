import { useState } from "react";
import { NUTRITION_POD_MAX, nutritionHeal, nutritionLevel } from "@/data";
import { useTownStore } from "@/store/townStore";
import { CryoFigureStrip } from "../CryoFigureStrip";
import { NutritionTechDetail, NutritionTechTree } from "../NutritionTechTree";
import { NutritionCandidateCard } from "./NutritionCandidateCard";
import { NutritionPodRack } from "./NutritionPodRack";
import { useNutritionAssign, type NutritionAssignment } from "./useNutritionAssign";
import kit from "../styles/cryoKit.module.css";
import techPage from "../NutritionTechTree/NutritionTechPage.module.css";
import s from "./NutritionPanel.module.css";

interface Props {
  onAdmit: (assignments: NutritionAssignment[]) => void;
  onResearch: (techId: string) => void;
}

export function NutritionPanel({ onAdmit, onResearch }: Props) {
  const awakened = useTownStore((state) => state.awakened);
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const nutrition = useTownStore((state) => state.nutrition);
  const [page, setPage] = useState<"pods" | "tech">("pods");
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const assign = useNutritionAssign({ awakened, characters, party, nutrition, loot, onAdmit });
  const level = nutritionLevel(nutrition.techs);

  return (
    <div className={kit.shell}>
      <div className={s.body}>
        <div className={s.viewport}>
          <div className={s.track} style={{ transform: page === "tech" ? "translateX(-50%)" : "translateX(0)" }}>
          <section className={s.page} aria-hidden={page === "tech"} {...(page === "tech" ? { inert: "" } : {})}>
            <div className={s.pageHead}>
              <div className={s.subhead}>
                <span className={s.kicker}>待疗养队员</span>
                <span className={s.count}>{assign.candidates.length} 人</span>
              </div>
              <button className={s.upgradeButton} type="button" onClick={() => setPage("tech")}>
                席位扩建 · 疗养舱 Lv.{level} ▸
              </button>
            </div>

            <NutritionPodRack
              occupants={nutrition.occupants}
              capacity={assign.capacity}
              assigned={assign.assigned}
              selectedCandidate={assign.selectedCandidate}
              selectedCharId={assign.selectedCharId}
              heal={nutritionHeal(nutrition.techs)}
              onPlace={assign.placeAt}
              onClear={assign.clearSlot}
            />

            <div className={s.candidatesSection}>
              <CryoFigureStrip className={s.candidates}>
                {assign.candidates.length ? assign.candidates.map((candidate) => (
                  <NutritionCandidateCard
                    key={candidate.charId}
                    candidate={candidate}
                    character={characters[candidate.charId]}
                    selected={assign.selectedCharId === candidate.charId}
                    onSelect={() => assign.selectChar(candidate.charId)}
                  />
                )) : <div className={s.empty}>目前没有需要疗养的队员</div>}
              </CryoFigureStrip>
            </div>
          </section>

          <section className={s.page} aria-hidden={page === "pods"} {...(page === "pods" ? { inert: "" } : {})}>
            <div className={techPage.layout}>
              <NutritionTechTree
                doneTechs={nutrition.techs}
                loot={loot}
                storage={storage}
                selectedId={selectedTechId}
                onSelect={setSelectedTechId}
              />
              <NutritionTechDetail
                selectedId={selectedTechId}
                doneTechs={nutrition.techs}
                loot={loot}
                storage={storage}
                onResearch={onResearch}
              />
            </div>
          </section>
          </div>
        </div>

        {page === "pods" ? (
          <div className={kit.panelFoot}>
            <div className={s.footCopy}>
              <p className={kit.note}>{assign.note}</p>
              <span className={s.cost}>已选 {assign.pendingCount} 人 · 单人消耗 100 居民积分</span>
            </div>
            <button className={kit.primary} type="button" disabled={!assign.canConfirm} onClick={assign.confirm}>
              {assign.pendingCount ? `确认疗养 −${assign.totalCost} 居民积分` : "确认疗养"}
            </button>
          </div>
        ) : (
          <div className={kit.panelFoot}>
            <div className={s.techReadout}>
              <span>疗养舱 Lv.{level}</span>
              <span>席位 {assign.capacity}/{NUTRITION_POD_MAX}</span>
              <span>单次恢复 +{nutritionHeal(nutrition.techs)}</span>
            </div>
            <button className={s.backButton} type="button" onClick={() => setPage("pods")}>
              ◂ 返回席位
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
