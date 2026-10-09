import { useState } from "react";
import { CardReplaceModal, type ReplaceCardAction } from "@/ui/explore/CardReplace";
import { PreviewStage } from "../preview/PreviewStage";
import { createCardReplaceDemo, replaceDemoCard } from "./cardReplaceDemoData";

function CardReplaceDemo() {
  const [demo, setDemo] = useState(createCardReplaceDemo);
  const [action, setAction] = useState<ReplaceCardAction | null>({});

  const replace = (charId: string, uid: string) => {
    const character = demo.characters[charId];
    if (!character || !action || action.result) return false;
    const result = replaceDemoCard(character, uid);
    if (!result) return false;
    setDemo((current) => ({
      ...current,
      characters: {
        ...current.characters,
        [charId]: { ...character, deck: character.deck.map((card) => card.uid === uid ? result.after : card) },
      },
    }));
    setAction({ result });
    return true;
  };

  return (
    <CardReplaceModal
      action={action}
      members={demo.members}
      characters={demo.characters}
      lockedCharId={null}
      kicker="界面演示 / 换卡"
      onReplace={replace}
      onFinish={() => setAction(null)}
    />
  );
}

export function CardReplacePreview() {
  return (
    <PreviewStage>
      <CardReplaceDemo />
    </PreviewStage>
  );
}
