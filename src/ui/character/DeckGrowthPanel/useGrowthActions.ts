import { useEffect, useMemo, useRef, useState } from "react";
import { makeCard } from "@/data";
import { deckRarityChances } from "@/engine";
import { useTownStore } from "@/store/townStore";
import { forgeViewModel } from "@/ui/character/DeckForge/forgeViewModel";

export type GrowthPage = "hub" | "draw" | "remove";

/** 只编排界面状态；费用、概率和可执行条件复用现有规则，扣费由 store 完成。 */
export function useGrowthActions(charId: string) {
  const cs = useTownStore((state) => state.characters[charId]);
  const day = useTownStore((state) => state.day);
  const [page, setPage] = useState<GrowthPage>(cs?.pendingDraw ? "draw" : "hub");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);
  const model = useMemo(() => cs ? forgeViewModel(cs, day) : null, [cs, day]);
  const candidates = useMemo(() => cs?.pendingDraw?.map((id) => makeCard(id)) ?? [], [cs?.pendingDraw]);
  const chances = useMemo(() => deckRarityChances(cs?.deckLevel ?? 0, model?.hasPool), [cs?.deckLevel, model?.hasPool]);
  const nextChances = useMemo(() => model?.costs.upgrade != null ? deckRarityChances((cs?.deckLevel ?? 0) + 1, model.hasPool) : null, [cs?.deckLevel, model]);

  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  function feedback(message: string) {
    setNotice(message);
    setBusy(true);
    timer.current = window.setTimeout(() => { timer.current = null; setBusy(false); }, 380);
  }

  function goBack() {
    if (timer.current != null) return;
    setPage("hub");
    setSelectedUid(null);
    setNotice(cs?.pendingDraw ? "抽卡候选已保留，可继续选卡" : "");
  }

  function openDraw() {
    if (!cs || !model || timer.current != null) return;
    if (!cs.pendingDraw) {
      if (!model.canDraw) return;
      useTownStore.getState().forgeDraw(charId);
    }
    if (!useTownStore.getState().characters[charId]?.pendingDraw) {
      setNotice("当前没有可抽取的卡牌");
      return;
    }
    setSelectedUid(null);
    setPage("draw");
    setNotice("");
  }

  function discardDraw() {
    if (!cs?.pendingDraw || timer.current != null) return;
    useTownStore.getState().cancelDraw(charId);
    setPage("hub");
    setSelectedUid(null);
    feedback("已放弃本次候选，经验不退还");
  }

  function openRemove() {
    if (!model?.canRemove || timer.current != null) return;
    setSelectedUid(null);
    setPage("remove");
    setNotice("");
  }

  function upgrade() {
    if (!cs || !model?.canUpgrade || timer.current != null) return;
    useTownStore.getState().upgradeDeck(charId);
    const after = useTownStore.getState().characters[charId];
    if (after && after.deckLevel > cs.deckLevel) feedback(`卡组已升至 ${after.deckLevel} 级`);
  }

  function confirmSelection() {
    if (!cs || !model || timer.current != null) return;
    const store = useTownStore.getState();
    if (page === "draw") {
      const card = candidates.find((candidate) => candidate.uid === selectedUid);
      if (!card || !cs.pendingDraw?.includes(card.id)) return;
      store.pickDraw(charId, card.id);
      const after = useTownStore.getState().characters[charId];
      feedback(after && after.deck.length > cs.deck.length ? `「${card.name}」已加入卡组` : "该卡已达到携带上限，本次候选已失效");
    } else if (page === "remove") {
      const card = cs.deck.find((candidate) => candidate.uid === selectedUid);
      if (!card || !model.canRemove) return;
      store.removeCard(charId, card.uid);
      if (useTownStore.getState().characters[charId]?.deck.some((candidate) => candidate.uid === card.uid)) {
        setNotice("当前无法移除这张卡牌");
        return;
      }
      feedback(`已移除「${card.name}」`);
    } else return;
    setPage("hub");
    setSelectedUid(null);
  }

  return { cs, model, page, candidates, selectedUid, setSelectedUid, notice, busy, chances, nextChances, goBack, openDraw, discardDraw, openRemove, upgrade, confirmSelection };
}
