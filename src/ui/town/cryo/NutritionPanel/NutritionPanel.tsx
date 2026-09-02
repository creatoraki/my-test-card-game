import { useEffect, useMemo, useState, type PointerEvent } from "react";
import {
  NUTRITION_MAX_LEVEL,
  NUTRITION_TECHS,
  NUTRITION_TREAT_COST,
  getCharacter,
  isTechAvailable,
  nutritionLevel,
  nutritionPods,
  nutritionTechCheck,
  nutritionTechsOfTier,
} from "@/data";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { HpBar } from "@/ui/common/HpBar";
import ItemSlot from "@/ui/common/item/ItemSlot";
import type { ItemStack } from "@/items/types";
import { useTownStore, vitalsOf } from "@/store/townStore";
import kit from "../styles/cryoKit.module.css";
import s from "./NutritionPanel.module.css";

interface Props {
  onAdmit: (charId: string) => void;
  onResearch: (techId: string) => void;
}

interface Candidate {
  charId: string;
  reason: string | null;
  damage: number;
}

export function NutritionPanel({ onAdmit, onResearch }: Props) {
  const awakened = useTownStore((state) => state.awakened);
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const nutrition = useTownStore((state) => state.nutrition);
  const [selected, setSelected] = useState<string | null>(null);
  const [tooltipText, setTooltipText] = useState("");
  const { point, bind } = useHoverTooltip();

  const occupantIds = useMemo(() => new Set(nutrition.occupants.map((occupant) => occupant.charId)), [nutrition.occupants]);
  const candidates = useMemo<Candidate[]>(
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
      : selectedCandidate?.reason ?? (selectedCandidate ? "可以送入营养舱" : "请选择一名需要疗养的队员");

  const showReason = (reason: string, event: PointerEvent<HTMLElement>) => {
    setTooltipText(reason);
    bind.onPointerEnter(event);
  };

  return (
    <>
      <div className={s.body}>
        <div className={s.rack}>
          {Array.from({ length: NUTRITION_MAX_LEVEL }, (_, index) => {
            const occupant = nutrition.occupants[index];
            const unlocked = index < capacity;
            const character = occupant ? getCharacter(occupant.charId) : null;
            return (
              <div key={index} className={`${s.pod} ${unlocked ? "" : s["is-locked"]} ${occupant ? s["is-occupied"] : ""}`}>
                <span className={s.lid} aria-hidden />
                {character ? (
                  <>
                    <span className={s.figure}><CharacterPortrait characterId={character.id} emoji={character.emoji} alt={character.name} className={s.portrait} /></span>
                    <span className={s.podText}><span className={s.podName}>{character.name}</span><span className={s.podMeta}>疗养中 · 明日 +{occupant.heal}</span></span>
                  </>
                ) : unlocked ? (
                  <span className={s.podText}><span className={s.emptyIcon}>＋</span><span className={s.podMeta}>空置</span></span>
                ) : (
                  <span className={s.podText}><span className={s.emptyIcon}>◇</span><span className={s.podMeta}>需舱位扩建 {index === 1 ? "I" : index === 2 ? "II" : "III"}</span></span>
                )}
              </div>
            );
          })}
        </div>

        <div className={s.right}>
          <div className={s.subhead}><span className={s.kicker}>可入舱队员</span><span className={s.count}>{candidates.length} 人</span></div>
          <div className={s.members}>
            {candidates.length ? candidates.map((candidate) => {
              const character = getCharacter(candidate.charId);
              const vitals = vitalsOf(characters[candidate.charId]);
              const disabled = candidate.reason !== null;
              const selectedClass = selected === candidate.charId ? s["is-selected"] : "";
              return (
                <div
                  key={candidate.charId}
                  className={s.memberWrap}
                  onPointerEnter={(event) => disabled && candidate.reason && showReason(candidate.reason, event)}
                  onPointerLeave={() => { setTooltipText(""); bind.onPointerLeave(); }}
                  onFocus={(event) => disabled && candidate.reason && (setTooltipText(candidate.reason), bind.onFocus(event))}
                  onBlur={() => { setTooltipText(""); bind.onBlur(); }}
                >
                  <button className={`${s.member} ${selectedClass}`} type="button" disabled={disabled} onClick={() => setSelected(candidate.charId)}>
                    <span className={s.memberFigure}><CharacterPortrait characterId={character.id} emoji={character.emoji} alt={character.name} className={s.memberPortrait} /></span>
                    <span className={s.memberInfo}><span className={s.memberName}>{character.name}</span><span className={s.damage}>体力极限 −{candidate.damage}</span></span>
                    <span className={s.hp}><HpBar hp={vitals.hp} hpLimit={vitals.hpLimit} maxHp={vitals.maxHp} /></span>
                    <span aria-hidden>{selected === candidate.charId ? "✓" : ""}</span>
                  </button>
                </div>
              );
            }) : <div className={s.empty}>目前没有需要疗养的队员</div>}
          </div>

          <div className={s.techSection}>
            <div className={s.subhead}><span className={s.kicker}>营养舱科技 · 等级 {level}</span><span className={s.count}>{nutrition.occupants.length}/{capacity} 舱位</span></div>
            {level >= NUTRITION_MAX_LEVEL ? (
              <div className={s.empty}>营养舱已达最高等级</div>
            ) : (
              <div className={s.techs}>
                {nutritionTechsOfTier(level).map((tech) => <TechCard key={tech.id} tech={tech} done={nutrition.techs.includes(tech.id)} doneTechs={nutrition.techs} storage={storage} loot={loot} onResearch={onResearch} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={kit.panelFoot}>
        <p className={kit.note}>{note}</p>
        <button className={kit.primary} type="button" disabled={selectedBlocked || nutrition.occupants.length >= capacity || loot < NUTRITION_TREAT_COST} onClick={() => selected && onAdmit(selected)}>
          送入营养舱 −{NUTRITION_TREAT_COST} 积分
        </button>
      </div>
      {point && tooltipText && <HoverTooltip point={point}>{tooltipText}</HoverTooltip>}
    </>
  );
}

function TechCard({ tech, done, doneTechs, storage, loot, onResearch }: { tech: (typeof NUTRITION_TECHS)[number]; done: boolean; doneTechs: string[]; storage: ItemStack[]; loot: number; onResearch: (techId: string) => void }) {
  const check = nutritionTechCheck(tech, loot, storage);
  const available = isTechAvailable(tech, doneTechs);
  return (
    <div className={`${s.tech} ${done ? s["is-done"] : ""}`}>
      <span className={s.techName}>{tech.name} {done ? "✓" : ""}</span>
      <span className={s.techDesc}>{tech.desc}</span>
      <div className={s.materials}>
        <span className={`${s.material} ${check.lootOk ? "" : s["is-lacking"]}`}>积分 {tech.loot}</span>
        {check.materials.map((material) => {
          const stack: ItemStack = { uid: `nutrition-${material.itemId}`, itemId: material.itemId, count: Math.max(material.have, 1) };
          return <span key={material.itemId} className={`${s.material} ${material.ok ? "" : s["is-lacking"]}`}><ItemSlot stack={stack} showName={false} disabled={!material.have} className={s.materialSlot} />×{material.need}</span>;
        })}
      </div>
      <button className={s.research} type="button" disabled={done || !available || !check.ok} onClick={() => onResearch(tech.id)}>{done ? "已研究" : "研究"}</button>
    </div>
  );
}