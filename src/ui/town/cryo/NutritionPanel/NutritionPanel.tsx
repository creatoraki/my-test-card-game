import { useState } from "react";
import { NUTRITION_POD_MAX, nutritionHeal, nutritionLevel } from "@/data";
import { useTownStore } from "@/store/townStore";
import { NutritionTechDetail, NutritionTechTree } from "../NutritionTechTree";
import { NutritionPodsPage } from "./NutritionPodsPage";
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
  const heal = nutritionHeal(nutrition.techs);

  return (
    <div className={kit.shell}>
      <div className={s.body}>
        <div className={s.viewport}>
          <div className={s.track} style={{ transform: page === "tech" ? "translateX(-50%)" : "translateX(0)" }}>
            <NutritionPodsPage
              occupants={nutrition.occupants}
              characters={characters}
              capacity={assign.capacity}
              assigned={assign.assigned}
              candidates={assign.candidates}
              selectedCandidate={assign.selectedCandidate}
              selectedCharId={assign.selectedCharId}
              heal={heal}
              level={level}
              onPlace={assign.placeAt}
              onClear={assign.clearSlot}
              onSelect={assign.selectChar}
              onOpenTech={() => setPage("tech")}
              ariaHidden={page === "tech"}
            />

            <section className={s.page} aria-hidden={page === "pods"} {...(page === "pods" ? { inert: "" } : {})}>
              <div className={techPage.layout}>
                <NutritionTechTree
                  doneTechs={nutrition.techs}
                  storage={storage}
                  selectedId={selectedTechId}
                  onSelect={setSelectedTechId}
                />
                <NutritionTechDetail
                  selectedId={selectedTechId}
                  doneTechs={nutrition.techs}
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
              <span className={s.cost}>
                已选 {assign.pendingCount} 人 · 单人消耗 100 居民积分 · 合计 −{assign.totalCost}
              </span>
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
              <span>单次恢复 +{heal}</span>
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
