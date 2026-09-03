import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { NUTRITION_TREAT_COST, nutritionLevel, nutritionPods } from "@/data";
import { useTownStore, vitalsOf } from "@/store/townStore";
import { CryoFigureStrip } from "../CryoFigureStrip";
import { NutritionCandidateCard, type NutritionCandidate } from "./NutritionCandidateCard";
import { NutritionPodRack } from "./NutritionPodRack";
import { NutritionUpgradePanel } from "./NutritionUpgradePanel";
import kit from "../styles/cryoKit.module.css";
import s from "./NutritionPanel.module.css";

interface Props {
  onAdmit: (charId: string) => void;
  onResearch: (techId: string) => void;
}

interface UpgradeState {
  x: number;
  y: number;
  closing: boolean;
}

export function NutritionPanel({ onAdmit, onResearch }: Props) {
  const awakened = useTownStore((state) => state.awakened);
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const nutrition = useTownStore((state) => state.nutrition);
  const [selected, setSelected] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeState | null>(null);

  const occupantIds = useMemo(() => new Set(nutrition.occupants.map((occupant) => occupant.charId)), [nutrition.occupants]);
  const candidates = useMemo<NutritionCandidate[]>(
    () => awakened.filter((charId) => !occupantIds.has(charId)).map((charId) => {
      const vitals = vitalsOf(characters[charId]);
      const damage = Math.max(0, vitals.maxHp - vitals.hpLimit);
      const reason = damage <= 0
        ? "体力极限已满, 无需进入营养舱"
        : party.includes(charId) && party.length <= 1
          ? "至少要保留 1 名队员上阵"
          : null;
      return { charId, reason, damage };
    }),
    [awakened, characters, occupantIds, party],
  );

  useEffect(() => {
    if (!selected || !candidates.some((candidate) => candidate.charId === selected)) {
      setSelected(candidates[0]?.charId ?? null);
    }
  }, [candidates, selected]);

  const selectedCandidate = candidates.find((candidate) => candidate.charId === selected) ?? null;
  const capacity = nutritionPods(nutrition.techs);
  const level = nutritionLevel(nutrition.techs);
  const selectedBlocked = !selectedCandidate || selectedCandidate.reason !== null;
  const note = nutrition.occupants.length >= capacity
    ? "舱位已满"
    : loot < NUTRITION_TREAT_COST
      ? "居民积分不足"
      : selectedCandidate?.reason ?? (selectedCandidate ? "点上方空席位即可送入疗养" : "请选择一名需要疗养的队员");

  const openUpgrade = (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    setUpgrade({ x: button.offsetLeft + button.offsetWidth / 2, y: button.offsetTop + button.offsetHeight / 2, closing: false });
  };

  return (
    <>
      <div className={s.body}>
        <NutritionPodRack
          occupants={nutrition.occupants}
          capacity={capacity}
          selectedCandidate={selectedCandidate}
          loot={loot}
          onAdmit={onAdmit}
        />

        <div className={s.candidatesSection}>
          <div className={s.subhead}>
            <span className={s.kicker}>可入舱队员</span>
            <span className={s.count}>{candidates.length} 人</span>
          </div>
          <CryoFigureStrip className={s.candidates}>
            {candidates.length ? candidates.map((candidate) => (
              <NutritionCandidateCard
                key={candidate.charId}
                candidate={candidate}
                character={characters[candidate.charId]}
                selected={selected === candidate.charId}
                onSelect={() => setSelected(candidate.charId)}
              />
            )) : <div className={s.empty}>目前没有需要疗养的队员</div>}
          </CryoFigureStrip>
        </div>

        <button className={s.upgradeButton} type="button" onClick={openUpgrade}>
          舱位扩建 · 科技 Lv.{level}
        </button>

        {upgrade && (
          <NutritionUpgradePanel
            level={level}
            doneTechs={nutrition.techs}
            storage={storage}
            loot={loot}
            origin={{ x: upgrade.x, y: upgrade.y }}
            closing={upgrade.closing}
            onResearch={onResearch}
            onClose={() => setUpgrade((current) => current ? { ...current, closing: true } : current)}
            onClosed={() => setUpgrade(null)}
          />
        )}
      </div>

      <div className={kit.panelFoot}>
        <p className={kit.note}>{note}</p>
        <span className={s.cost}>送入疗养将消耗 {NUTRITION_TREAT_COST} 居民积分</span>
        <span className={s.selectedState}>{selectedBlocked ? "当前队员不可入舱" : "选择席位完成送入"}</span>
      </div>
    </>
  );
}