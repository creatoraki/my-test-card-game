import { useEffect, useState } from "react";
import { activeCurioDef, selectableStacks, visibleDecisions } from "@/explore/curio/visibility";
import { picksFit } from "@/explore/curio/resolve";
import { offerStacks, validFreeOffer } from "@/explore/curio/freeOffer";
import { hasCorridorRewards } from "@/explore/corridor/corridorSession";
import type { ExploreState } from "@/explore/types";
import { useRunStore } from "@/store/run/runStore";
import { useExploreStore } from "@/store/explore/exploreStore";
import { closeCorridorObject } from "@/store/explore/exploreCorridor";
import { travelWaystone } from "@/store/explore/curioActions";
import {
  DossierChoice,
  DossierExecutor,
  DossierInfoBox,
  DossierLoot,
  DossierOffer,
  DossierResult,
  EventDossierPanel,
  type DossierAction,
} from "@/ui/explore/EventDossier";
import { useBagFull } from "@/ui/explore/LootPickup";
import { curioTheme } from "./curioTheme";
import { decisionAction, needsPicking, offerPreview, pickingLines } from "./curioDecisionAction";
import { CoinExchangeDesk } from "./CoinExchangeDesk";
import { useCurioLoot, type CurioLoot } from "../useCurioLoot";

const DEFAULT_EN_TITLE = "探索交互";

/** 按句末标点断行，还原设计图"一句一行"的描述排版。 */
function sentences(text: string): string[] {
  return text.split(/(?<=[。？！])/).filter(Boolean);
}

/** 结算页按钮: 有掉落时换成「全部拾取 / 放弃一切」, 处理完由 useCurioLoot 直接结束事件。 */
function resultActions(session: ExploreState, loot: CurioLoot, onOpenBag: () => void): DossierAction[] {
  const bag: DossierAction[] = session.chuteOpen
    ? [{ id: "bag", label: "选择物品与食品投递", icon: "bag", onClick: onOpenBag }]
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

/** 当前选中的执行者；选中的人倒下或尚未选择时回落到第一名存活队员。 */
function resolveExecutor(session: ExploreState, picked: string | null): string | null {
  const alive = session.party.filter((member) => member.alive);
  return alive.find((member) => member.charId === picked)?.charId ?? alive[0]?.charId ?? null;
}

export function CurioPanel({
  session,
  onOpenBag,
  onTravel,
  covered,
}: {
  session: ExploreState;
  onOpenBag: () => void;
  /** 传送盆传送：交给场景的黑场过渡执行。 */
  onTravel: (travel: () => boolean) => void;
  covered: boolean;
}) {
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [pickedExecutor, setPickedExecutor] = useState<string | null>(null);
  const loot = useCurioLoot();
  const bagFull = useBagFull();
  const object = session.corridor?.objects.find((item) => item.id === session.corridor?.activeObjectId);
  const def = activeCurioDef(session);
  const result = session.phase === "resolving";

  useEffect(() => {
    if (result) setSelectingId(null);
  }, [result]);
  useEffect(() => {
    setSelectingId(null);
  }, [object?.id]);
  if (!def || !object || object.kind === "merchant") return null;

  const decisions = visibleDecisions(session, def);
  const selecting = decisions.find((decision) => decision.id === selectingId && needsPicking(decision)) ?? null;
  const executorId = resolveExecutor(session, pickedExecutor);
  const roomLabel = session.dungeon?.rooms[session.dungeon.currentRoomId]?.label ?? "?";
  // 陷阱物件: 进房立即触发, 不能暂不处理, 也不收交互粒子。
  const forced = Boolean(def.forced);
  const contentKey = `curio-${object.id}-${result ? "result" : selecting ? "select" : "choice"}`;

  const choiceActions: DossierAction[] = [
    ...decisions.map((decision, index) => decisionAction(
      session, decision, index, executorId, setSelectingId, () => onTravel(travelWaystone),
    )),
    ...(forced ? [] : [{
      id: "leave",
      label: "暂不处理，继续前进",
      icon: "leave",
      sfx: "back",
      onClick: closeCorridorObject,
    } satisfies DossierAction]),
  ];

  const canSubmitSelect = (picks: { uid: string; count: number }[]) => Boolean(selecting && picksFit(session, selecting, picks));
  const previewSelect = (picks: { uid: string; count: number }[]) => {
    const offered = selecting?.offer ? validFreeOffer(session, selecting.offer, picks) : null;
    return selecting && offered ? offerPreview(selecting, offered) : null;
  };

  return <>
    <EventDossierPanel
      theme={curioTheme(object.kind)}
      kicker={forced ? `陷阱房间 · ${roomLabel}号房间` : `${def.name} · ${roomLabel}号房间`}
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
          loot={session.coinExchangeOpen
            ? <CoinExchangeDesk session={session} />
            : session.pendingLoot.length
              ? <DossierLoot
                items={session.pendingLoot}
                message={loot.message}
                onPick={loot.pick}
                onOpenBag={loot.message || bagFull ? onOpenBag : undefined}
              />
              : undefined}
          actions={resultActions(session, loot, onOpenBag)}
        />
      ) : selecting && executorId ? (
        <DossierOffer
          backpack={selecting.offer ? offerStacks(session, selecting.offer) : selectableStacks(session, selecting)}
          objectId={`${object.id}-${selecting.id}`}
          lines={pickingLines(selecting)}
          canSubmit={canSubmitSelect}
          preview={previewSelect}
          onBack={() => setSelectingId(null)}
          onSubmit={(picks) => useRunStore.getState().selectCurio(selecting.id, executorId, picks)}
        />
      ) : (
        <DossierChoice
          lines={sentences(def.description)}
          info={<DossierInfoBox variant="executor">
            <DossierExecutor party={session.party} selectedId={executorId} onSelect={setPickedExecutor} />
          </DossierInfoBox>}
          actions={choiceActions}
        />
      )}
    </EventDossierPanel>
    {loot.flyingPortal}
  </>;
}
