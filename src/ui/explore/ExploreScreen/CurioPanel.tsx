import { useEffect, useState } from "react";
import { CORRIDOR_CURIOS } from "@/data/curios";
import type { CurioDecision } from "@/data/curios/types";
import { canOfferAny, visibleDecisions } from "@/explore/curio/visibility";
import { serviceFoodCount } from "@/explore/curio/foodPayment";
import { hasCorridorRewards } from "@/explore/corridor/session";
import type { ExploreState } from "@/explore/types";
import { useRunStore } from "@/store/runStore";
import { useExploreStore } from "@/store/exploreStore";
import { closeCorridorObject } from "@/store/exploreCorridor";
import {
  DossierChoice,
  DossierLoot,
  DossierOffer,
  DossierResult,
  EventDossierPanel,
  type DossierAction,
  type DossierIconName,
} from "@/ui/explore/EventDossier";
import { useCurioLoot, type CurioLoot } from "./useCurioLoot";

const DEFAULT_EN_TITLE = "探索交互";
const DECISION_ICONS: DossierIconName[] = ["claim", "upgrade", "detail"];

function decisionIcon(decision: CurioDecision, index: number): DossierIconName {
  if (decision.require?.kind === "job") return "upgrade";
  return DECISION_ICONS[index % DECISION_ICONS.length];
}

/** 按句末标点断行，还原设计图"一句一行"的描述排版。 */
function sentences(text: string): string[] {
  return text.split(/(?<=[。？！])/).filter(Boolean);
}

/** 结算页按钮: 有掉落时换成「全部拾取 / 放弃一切」, 处理完由 useCurioLoot 直接结束事件。 */
function resultActions(session: ExploreState, loot: CurioLoot, onOpenBag: () => void): DossierAction[] {
  const bag: DossierAction[] = session.chuteOpen
    ? [{ id: "bag", label: "打开背包寄回物品", icon: "bag", onClick: onOpenBag }]
    : [];
  if (session.pendingLoot.length) {
    return [
      { id: "take-all", label: "全部拾取", icon: "claim", tone: "primary", onClick: loot.takeAll },
      {
        id: "abandon",
        label: loot.confirmAbandon ? "确认放弃？" : "放弃一切",
        cost: loot.confirmAbandon ? "未拾取的物品会永久丢失" : undefined,
        costTone: "red",
        icon: "discard",
        tone: "danger",
        sfx: "back",
        onClick: loot.abandon,
      },
      ...bag,
    ];
  }
  return [
    ...bag,
    {
      id: "confirm",
      label: "收拾行装，继续探索",
      icon: "confirm",
      sfx: "confirm",
      disabled: hasCorridorRewards(session),
      onClick: () => useExploreStore.getState().confirmNode(),
    },
  ];
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
  const loot = useCurioLoot();
  const object = session.corridor?.objects.find((item) => item.id === session.corridor?.activeObjectId);
  const def = object ? CORRIDOR_CURIOS[object.kind] : null;
  const result = session.phase === "resolving";

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
      disabled: serviceFoodCount(session) < (decision.foodCost ?? 0),
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

  return <>
    <EventDossierPanel
      kicker={forced ? `风险房间 · ${roomLabel}号房间` : `${def.name} · ${roomLabel}号房间`}
      title={def.name}
      enTitle={DEFAULT_EN_TITLE}
      contentKey={contentKey}
      active={!covered}
      onClose={result || forced ? undefined : closeCorridorObject}
    >
      {result ? (
        <DossierResult
          story={session.pendingStory.flatMap(sentences)}
          notes={session.pendingNotes}
          loot={session.pendingLoot.length
            ? <DossierLoot items={session.pendingLoot} message={loot.message} onPick={loot.pick} />
            : undefined}
          actions={resultActions(session, loot, onOpenBag)}
        />
      ) : offerMode ? (
        <DossierOffer
          backpack={session.backpack}
          objectId={object.id}
          onBack={() => setOfferMode(false)}
          onSubmit={(picks) => useRunStore.getState().offerCurio(picks)}
        />
      ) : (
        <DossierChoice lines={sentences(def.description)} actions={choiceActions} />
      )}
    </EventDossierPanel>
    {loot.flyingPortal}
  </>;
}
