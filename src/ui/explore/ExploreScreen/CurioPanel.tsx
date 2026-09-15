import { useEffect, useState } from "react";
import { CORRIDOR_CURIOS } from "@/data/curios";
import { canOfferAny, visibleDecisions } from "@/explore/curio/visibility";
import { hasCorridorRewards } from "@/explore/corridor/session";
import { interactionCost } from "@/explore/session";
import type { ExploreState } from "@/explore/types";
import { useRunStore } from "@/store/runStore";
import { useExploreStore } from "@/store/exploreStore";
import { closeCorridorObject } from "@/store/exploreCorridor";
import { EventPanelButton, EventPanelChoice, EventPanelResult } from "@/ui/common/EventPanel";
import { CurioOfferView } from "./CurioOfferView";
import { ExploreObjectPanel } from "./ExploreObjectPanel";
import objectPanelStyles from "./ExploreObjectPanel.module.css";

export function CurioPanel({
  session,
  onOpenBag,
  covered,
}: {
  session: ExploreState;
  onOpenBag: () => void;
  covered: boolean;
}) {
  const [offerMode, setOfferMode] = useState(false);
  const object = session.corridor?.objects.find((item) => item.id === session.corridor?.activeObjectId);
  const def = object ? CORRIDOR_CURIOS[object.kind] : null;
  const result = session.phase === "resolving";
  const rewards = hasCorridorRewards(session);

  useEffect(() => {
    if (result) setOfferMode(false);
  }, [result]);
  if (!def || !object || object.kind === "merchant") return null;

  const decisions = visibleDecisions(session, def);
  const offeringAvailable = canOfferAny(session, def);
  const roomLabel = session.dungeon?.rooms[session.dungeon.currentRoomId]?.label ?? "?";
  const scene = result ? "result" : "choice";
  const contentKey = `curio-${object.id}-${result ? "result" : offerMode ? "offer" : "choice"}`;
  const onEscape = () => {
    if (!result) closeCorridorObject();
  };

  return (
    <ExploreObjectPanel
      accent="#f0b46a"
      kicker={`${def.name} · ${roomLabel} 号房间`}
      title={def.name}
      status={result ? "搜寻结果" : offerMode ? "黑盒放入" : "驻足调查"}
      scene={scene}
      contentKey={contentKey}
      active={!covered}
      onEscape={onEscape}
    >
      {result ? (
        <EventPanelResult
          seal="◆"
          eyebrow="搜寻结果"
          heading={def.name}
          story={<div className={objectPanelStyles.story}>{session.pendingStory.map((text, index) => <p key={`story-${index}`}>{text}</p>)}</div>}
          notes={session.pendingNotes.map((text, index) => ({ text, delayMs: 180 + index * 120 }))}
          footNote={rewards ? "请先处理奖励" : "结算完毕"}
          footActions={session.chuteOpen ? <EventPanelButton onClick={onOpenBag}>打开背包，选择寄回物品</EventPanelButton> : undefined}
          confirmLabel="收拾行装，继续探索"
          confirmDisabled={rewards}
          onConfirm={() => useExploreStore.getState().confirmNode()}
        />
      ) : offerMode ? (
        <CurioOfferView
          backpack={session.backpack}
          objectId={object.id}
          onBack={() => setOfferMode(false)}
          onSubmit={(picks) => useRunStore.getState().offerCurio(picks)}
        />
      ) : (
        <EventPanelChoice
          heading={def.name}
          hint={def.description}
          signal={`操作物件消耗 ${interactionCost(session)} 点净化粒子 · 离开不消耗`}
          options={[
            ...decisions.map((decision) => ({ id: decision.id, name: decision.label })),
            ...(offeringAvailable ? [{
              id: "offer",
              name: "尝试放入什么物体看看会不会发生什么",
              description: "从背包挑选物品放入",
              costTone: "cyan" as const,
            }] : []),
          ]}
          onPick={(index) => {
            if (index < decisions.length) useRunStore.getState().chooseCurio(decisions[index].id);
            else setOfferMode(true);
          }}
          backLabel="暂不处理，继续行走"
          onBack={closeCorridorObject}
        />
      )}
    </ExploreObjectPanel>
  );
}
