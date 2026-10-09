import { useCallback, useState } from "react";
import type { Card } from "@/engine";
import { commonReplaceCandidates } from "@/store/town/deckCards";
import type { CharacterState } from "@/store/town/townTypes";
import { DeckServiceModal, type DeckCardSkin, type DeckServiceMode, type DeckServiceResult } from "@/ui/explore/CardReplace";
import { PreviewStage } from "../preview/PreviewStage";
import { createCardReplaceDemo, runDemoService } from "./cardReplaceDemoData";

const MODES: { mode: DeckServiceMode; label: string; kicker: string }[] = [
  { mode: "replace", label: "换卡", kicker: "界面演示 · 换卡" },
  { mode: "remove", label: "删卡", kicker: "界面演示 · 删卡" },
  { mode: "copy", label: "复制", kicker: "界面演示 · 复制" },
];

function cardReasonFor(mode: DeckServiceMode) {
  return (character: CharacterState, card: Card) => {
    if (mode === "replace") return commonReplaceCandidates(character, card.uid).length ? null : "没有可换出的普通卡";
    if (mode === "remove") return character.deck.length > character.minDeckSize ? null : "卡组已到下限";
    return null;
  };
}

const SKINS: { skin: DeckCardSkin; label: string }[] = [
  { skin: "pick", label: "三选一卡面" },
  { skin: "hand", label: "原版卡面" },
];

const REASONS: Record<DeckServiceMode, ReturnType<typeof cardReasonFor>> = {
  replace: cardReasonFor("replace"),
  remove: cardReasonFor("remove"),
  copy: cardReasonFor("copy"),
};

export function CardReplacePreview() {
  const [demo, setDemo] = useState(createCardReplaceDemo);
  const [mode, setMode] = useState<DeckServiceMode>("replace");
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState<DeckServiceResult | null>(null);
  const [round, setRound] = useState(0);
  const [skin, setSkin] = useState<DeckCardSkin>("pick");
  const info = MODES.find((entry) => entry.mode === mode) ?? MODES[0];

  const restart = (next: DeckServiceMode) => {
    setMode(next);
    setResult(null);
    setOpen(true);
    setRound((value) => value + 1);
  };

  const confirm = useCallback((charId: string, uid: string) => {
    const character = demo.characters[charId];
    if (!character || result) return false;
    const outcome = runDemoService(mode, character, uid);
    if (!outcome) return false;
    setDemo((current) => ({
      ...current,
      characters: { ...current.characters, [charId]: { ...character, deck: outcome.deck } },
    }));
    setResult(outcome.result);
    return true;
  }, [demo, mode, result]);

  return (
    <PreviewStage controls={
      <>
        {MODES.map((entry) => (
          <button key={entry.mode} type="button" aria-pressed={entry.mode === mode} onClick={() => restart(entry.mode)}>
            {entry.label}
          </button>
        ))}
        <button type="button" onClick={() => { setDemo(createCardReplaceDemo()); restart(mode); }}>重置卡组</button>
        {SKINS.map((entry) => (
          <button key={entry.skin} type="button" aria-pressed={entry.skin === skin} onClick={() => setSkin(entry.skin)}>
            {entry.label}
          </button>
        ))}
      </>
    }>
      <DeckServiceModal
        key={round}
        mode={mode}
        open={open}
        result={result}
        members={demo.members}
        characters={demo.characters}
        lockedCharId={null}
        kicker={info.kicker}
        cardReason={REASONS[mode]}
        onConfirm={confirm}
        onFinish={() => setOpen(false)}
        cardSkin={skin}
      />
    </PreviewStage>
  );
}
