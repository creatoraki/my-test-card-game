import { useEffect, useMemo, useState } from "react";
import { NUTRITION_TREAT_COST, nutritionPods } from "@/data";
import { playSfx } from "@/ui/audio";
import type { NutritionState, CharacterState } from "@/store/townStore";
import { vitalsOf } from "@/store/townStore";

export interface NutritionCandidate {
  charId: string;
  reason: string | null;
  damage: number;
  assignedSlot?: number;
}

export interface NutritionAssignment {
  charId: string;
  slot: number;
}

interface Params {
  awakened: string[];
  characters: Record<string, CharacterState>;
  party: string[];
  nutrition: NutritionState;
  loot: number;
  onAdmit: (assignments: NutritionAssignment[]) => void;
}

export function useNutritionAssign({ awakened, characters, party, nutrition, loot, onAdmit }: Params) {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<Record<number, string>>({});
  const capacity = nutritionPods(nutrition.techs);

  const candidates = useMemo<NutritionCandidate[]>(() => {
    const occupantIds = new Set(nutrition.occupants.map((occupant) => occupant.charId));
    const assignedIds = new Set(Object.values(assigned));

    return awakened
      .filter((charId) => !occupantIds.has(charId))
      .map((charId) => {
        const character = characters[charId];
        const vitals = vitalsOf(character);
        const damage = Math.max(0, vitals.maxHp - vitals.hpLimit);
        const assignedSlot = Object.entries(assigned).find(([, id]) => id === charId)?.[0];
        const reason = party.includes(charId) && party.filter((id) => id !== charId && !assignedIds.has(id)).length < 1
          ? "至少要保留 1 名队员上阵"
          : null;
        return {
          charId,
          reason,
          damage,
          assignedSlot: assignedSlot === undefined ? undefined : Number(assignedSlot),
        };
      });
  }, [assigned, awakened, characters, nutrition.occupants, party]);

  useEffect(() => {
    const validIds = new Set(
      candidates.filter((candidate) => candidate.reason === null).map((candidate) => candidate.charId),
    );
    setAssigned((current) => {
      let changed = false;
      const next: Record<number, string> = {};
      for (const [slot, charId] of Object.entries(current)) {
        if (validIds.has(charId)) next[Number(slot)] = charId;
        else changed = true;
      }
      return changed ? next : current;
    });
  }, [candidates]);

  useEffect(() => {
    const selected = candidates.find((candidate) => candidate.charId === selectedCharId);
    if (selected && selected.reason === null) return;
    if (selectedCharId !== null) setSelectedCharId(null);
  }, [candidates, selectedCharId]);

  const pendingCount = Object.keys(assigned).length;
  const totalCost = NUTRITION_TREAT_COST * pendingCount;
  const assignedIds = useMemo(() => new Set(Object.values(assigned)), [assigned]);
  const selectedCandidate = candidates.find((candidate) => candidate.charId === selectedCharId) ?? null;
  const partySafe = party.filter((id) => !assignedIds.has(id)).length >= 1;
  const canConfirm = pendingCount > 0 && partySafe && loot >= totalCost && candidates
    .filter((candidate) => assignedIds.has(candidate.charId))
    .every((candidate) => candidate.reason === null);

  const selectChar = (charId: string) => {
    const candidate = candidates.find((entry) => entry.charId === charId);
    if (candidate) setSelectedCharId(charId);
  };

  const placeAt = (slot: number) => {
    if (slot < 0 || slot >= capacity || nutrition.occupants.some((occupant) => occupant.slot === slot)) return;
    if (!selectedCandidate || selectedCandidate.reason !== null) return;

    setAssigned((current) => {
      const next = { ...current };
      for (const [oldSlot, charId] of Object.entries(next)) {
        if (charId === selectedCandidate.charId) delete next[Number(oldSlot)];
      }
      next[slot] = selectedCandidate.charId;
      return next;
    });
  };

  const clearSlot = (slot: number) => {
    if (!(slot in assigned)) return;
    setAssigned((current) => {
      const next = { ...current };
      delete next[slot];
      return next;
    });
  };

  const confirm = () => {
    if (!canConfirm) return;
    const assignments = Object.entries(assigned)
      .map(([slot, charId]) => ({ charId, slot: Number(slot) }))
      .sort((left, right) => left.slot - right.slot);
    playSfx("confirm");
    onAdmit(assignments);
    setAssigned({});
    setSelectedCharId(null);
  };

  const note = pendingCount > 0
    ? !partySafe
      ? "至少要保留 1 名队员上阵"
      : loot < totalCost
        ? "居民积分不足"
        : `已安排 ${pendingCount} 人, 点击右侧确认疗养`
    : nutrition.occupants.length >= capacity
      ? "已解锁席位均在疗养中"
      : candidates.some((candidate) => candidate.reason === null)
        ? "点右侧队员高亮, 再点空席位完成分配"
        : "目前没有可入舱的队员（至少要保留 1 名队员上阵）";

  return {
    assigned,
    candidates,
    canConfirm,
    capacity,
    clearSlot,
    confirm,
    note,
    pendingCount,
    placeAt,
    selectedCharId,
    selectedCandidate,
    selectChar,
    totalCost,
  };
}
