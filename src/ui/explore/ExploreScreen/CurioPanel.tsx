import { useEffect, useState } from "react";
import { CORRIDOR_CURIOS } from "@/data/curios";
import type { CurioDecision } from "@/data/curios/types";
import { canOfferAny, visibleDecisions } from "@/explore/curio/visibility";
import { hasCorridorRewards } from "@/explore/corridor/session";
import { interactionCost } from "@/explore/session";
import type { ExploreState } from "@/explore/types";
import { useRunStore } from "@/store/runStore";
import { useExploreStore } from "@/store/exploreStore";
import { closeCorridorObject } from "@/store/exploreCorridor";
import {
  DossierChoice,
  DossierCost,
  DossierInfoBox,
  DossierOffer,
  DossierResult,
  EventDossierPanel,
  ParticleCrystal,
  type DossierAction,
  type DossierIconName,
} from "@/ui/explore/EventDossier";

const DEFAULT_EN_TITLE = "EXPLORATION EVENT";
const DECISION_ICONS: DossierIconName[] = ["claim", "upgrade", "detail"];

function decisionIcon(decision: CurioDecision, index: number): DossierIconName {
  if (decision.require?.kind === "job") return "upgrade";
  return DECISION_ICONS[index % DECISION_ICONS.length];
}

/** 按句末标点断行，还原设计图"一句一行"的描述排版。 */
function sentences(text: string): string[] {
  return text.split(/(?<=[。？！])/).filter(Boolean);
}

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
  // 风险房物件: 进房立即触发, 不能暂不处理, 也不收交互粒子。
  const forced = Boolean(def.forced);
  const contentKey = `curio-${object.id}-${result ? "result" : offerMode ? "offer" : "choice"}`;

  const choiceActions: DossierAction[] = [
    ...decisions.map((decision, index): DossierAction => ({
      id: decision.id,
      label: decision.label,
      icon: decisionIcon(decision, index),
      sfx: "confirm",
      onClick: () => useRunStore.getState().chooseCurio(decision.id),
    })),
    ...(offeringAvailable ? [{
      id: "offer",
      label: "尝试放入物品",
      icon: "offer",
      onClick: () => setOfferMode(true),
    } satisfies DossierAction] : []),
    ...(forced ? [] : [{
      id: "leave",
      label: "暂不处理，继续前进",
      icon: "leave",
      sfx: "back",
      onClick: closeCorridorObject,
    } satisfies DossierAction]),
  ];

  const resultActions: DossierAction[] = [
    ...(session.chuteOpen ? [{
      id: "bag",
      label: "打开背包寄回物品",
      icon: "bag",
      onClick: onOpenBag,
    } satisfies DossierAction] : []),
    {
      id: "confirm",
      label: "收拾行装，继续探索",
      icon: "confirm",
      sfx: "confirm",
      disabled: rewards,
      onClick: () => useExploreStore.getState().confirmNode(),
    },
  ];

  return (
    <EventDossierPanel
      kicker={forced ? `风险房间 · ${roomLabel}号房间` : `${def.name} · ${roomLabel}号房间`}
      title={def.name}
      enTitle={def.enName ?? DEFAULT_EN_TITLE}
      contentKey={contentKey}
      active={!covered}
      onClose={result || forced ? undefined : closeCorridorObject}
    >
      {result ? (
        <DossierResult
          story={session.pendingStory.map((text, index) => <p key={`story-${index}`}>{text}</p>)}
          notes={session.pendingNotes}
          footNote={rewards ? "请先处理奖励" : "结算完毕"}
          actions={resultActions}
        />
      ) : offerMode ? (
        <DossierOffer
          backpack={session.backpack}
          objectId={object.id}
          onBack={() => setOfferMode(false)}
          onSubmit={(picks) => useRunStore.getState().offerCurio(picks)}
        />
      ) : (
        <DossierChoice
          body={sentences(def.description).map((text, index) => <p key={`desc-${index}`}>{text}</p>)}
          info={
            forced ? (
              <DossierInfoBox icon={<ParticleCrystal />} tone="danger">
                <DossierCost lead="风险应对消耗" amount={0} note="必须做出选择才能继续探索" />
              </DossierInfoBox>
            ) : (
              <DossierInfoBox icon={<ParticleCrystal />}>
                <DossierCost lead="操作物件消耗" amount={interactionCost(session)} note={`若不${def.verb}则无消耗`} />
              </DossierInfoBox>
            )
          }
          actions={choiceActions}
        />
      )}
    </EventDossierPanel>
  );
}
