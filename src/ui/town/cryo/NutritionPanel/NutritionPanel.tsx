// 疗养舱席位页。科技树不再在本组件里横向滑出, 而是由 CryoPanel 切到「疗养科技」子页,
// 与商店「设施升级」同一套交互。
import { nutritionHeal, nutritionLevel } from "@/data";
import { useTownStore } from "@/store/town/townStore";
import { MarketActionButton } from "@/ui/town/shop/MarketPanel";
import { NutritionPodsPage } from "./NutritionPodsPage";
import { useNutritionAssign, type NutritionAssignment } from "./useNutritionAssign";
import kit from "../styles/cryoKit.module.css";
import s from "./NutritionPanel.module.css";

interface Props {
  onAdmit: (assignments: NutritionAssignment[]) => void;
  onUpgrade: () => void;
}

export function NutritionPanel({ onAdmit, onUpgrade }: Props) {
  const awakened = useTownStore((state) => state.awakened);
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const loot = useTownStore((state) => state.loot);
  const nutrition = useTownStore((state) => state.nutrition);
  const assign = useNutritionAssign({ awakened, characters, party, nutrition, loot, onAdmit });
  const level = nutritionLevel(nutrition.techs);
  const heal = nutritionHeal(nutrition.techs);

  return (
    <div className={kit.shell}>
      <div className={s.body}>
        <NutritionPodsPage
          occupants={nutrition.occupants}
          characters={characters}
          capacity={assign.capacity}
          assigned={assign.assigned}
          candidates={assign.candidates}
          selectedCandidate={assign.selectedCandidate}
          selectedCharId={assign.selectedCharId}
          heal={heal}
          onPlace={assign.placeAt}
          onClear={assign.clearSlot}
          onSelect={assign.selectChar}
        />

        <div className={kit.panelFoot}>
          <div className={kit.summary}>
            <strong className={kit.summaryTitle}>疗养信息</strong>
            <div className={s.footCopy}>
              <p className={kit.note}>{assign.note}</p>
              <span className={s.cost}>
                已选 {assign.pendingCount} 人 · 单人消耗 100 居民积分 · 合计 −{assign.totalCost}
              </span>
            </div>
          </div>
          <div className={kit.actions}>
            <MarketActionButton
              tone="med"
              icon="✚"
              label="确认疗养"
              meta={`−${assign.totalCost} 积分`}
              disabled={!assign.canConfirm}
              onClick={assign.confirm}
            />
            <MarketActionButton
              tone="med"
              icon="⇧"
              label="设施升级"
              meta={`等级 ${level}`}
              onClick={onUpgrade}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
