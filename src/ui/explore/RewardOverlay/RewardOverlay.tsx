// ★ 事件奖励浮层 ★ —— 事件结算后 pendingActions 逐条弹出的处理面板。
//
// ⚠ 版式不在这里: 外框取自 explorePanel 的 panel-box(在 rewardKit 里缩到 1120×780), 页眉/正文/底栏/按钮/选择卡
//   全部来自 ui/common/widget/EventPanel 的原语 —— 与落点事件面板同一套设计语言,
//   这样「选完选项 → 弹出奖励」时页眉基线与按钮行不会跳。
//   本文件只负责: 奖励种类 → 内容与文案。
// ★ 角色卡牌奖励(forgeDraw)生成候选后, 三选一交给通用的 CardRewardPicker 独立弹窗,
//   此时本面板整体隐藏, 避免弹窗背后再露出一块空面板。
// ★ 普通卡替换(replaceCard)同理, 整段交给 ui/explore/CardReplace 的独立置换弹窗(选卡 + 置换演出)。
import { useEffect, useMemo, useRef, useState } from "react";
import { makeCard } from "@/data";
import type { ExploreState, PendingAction } from "@/explore/types";
import { useTownStore } from "@/store/town/townStore";
import { useExploreStore } from "@/store/explore/exploreStore";
import { useRunStore } from "@/store/run/runStore";
import { cx } from "@/ui/common/shared/cx";
import { useRevealPresence } from "@/ui/common/frame/ModalReveal";
import { EventPanelFrame } from "@/ui/common/widget/EventPanel";
import { CardRewardPicker, type CardPickOption } from "@/ui/common/card/CardRewardPicker";
import { panelRevealCloseMs, panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { DOSSIER_ACCENT } from "@/ui/explore/EventDossier";
import RelicOffers from "./RelicOffers";
import { EquipmentTuneReward } from "./EquipmentTuneReward";
import { CardReplaceModal } from "@/ui/explore/CardReplace";
import { replaceExploreCard } from "@/store/explore/exploreGrowthServices";
import { CharacterPicker, PartyReward, QuirkReward, PurifyReward } from "./RewardCharacters";
import { FreeDraw, FreeRemove } from "./RewardCards";
import { EquipOffers, ReforgePicker } from "./RewardEquipment";
import s from "@/ui/explore/styles/rewardKit.module.css";

// 奖励浮层的主色 = 事件档案面板主色: 它是从事件面板里拉起的小一号子弹窗, 外框与配色保持一致。
// 通过 EventPanelFrame 的 accent 下发给页眉/边线/按钮; 外框描边读 rewardKit 的 --k(同值)。
const REWARD_ACCENT = DOSSIER_ACCENT;

interface RewardView {
  session: ExploreState;
  action: PendingAction;
}

interface RewardOverlayProps {
  gate: boolean;
}

export default function RewardOverlay({ gate }: RewardOverlayProps) {
  const session = useExploreStore((state) => state.session);
  const grantExpTo = useExploreStore((state) => state.grantExpTo);
  const resolvePendingAction = useExploreStore((state) => state.resolvePendingAction);
  const acceptEquipOffer = useExploreStore((state) => state.acceptEquipOffer);
  const acceptRelicOffer = useExploreStore((state) => state.acceptRelicOffer);
  const reforgeBackpackItem = useExploreStore((state) => state.reforgeBackpackItem);
  const resolvePendingHeal = useRunStore((state) => state.resolvePendingHeal);
  const resolvePendingQuirk = useRunStore((state) => state.resolvePendingQuirk);
  const resolvePendingPollution = useRunStore((state) => state.resolvePendingPollution);
  const resolvePendingPurification = useRunStore((state) => state.resolvePendingPurification);
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const startTaintedDraw = useRunStore((state) => state.startTaintedDraw);
  const pickDraw = useTownStore((state) => state.pickDraw);
  const cancelDraw = useTownStore((state) => state.cancelDraw);
  const removeCardFree = useTownStore((state) => state.removeCardFree);
  const reforgeEquipped = useTownStore((state) => state.reforgeEquipped);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  // 三选一已在弹窗里结算: 队列清空后的退场期间不再把本面板亮出来(否则会闪一下选角色页)。
  const [drawSettled, setDrawSettled] = useState(false);
  // 锁定交互者的锻造自动开始; 以队列长度作键(会话克隆不改变它), ref 防 StrictMode 双触发重复污染。
  const autoDrawRef = useRef<number | null>(null);
  const [autoDrawKey, setAutoDrawKey] = useState<number | null>(null);

  const currentAction = session?.pendingActions[0];
  const presence = useRevealPresence<RewardView | null>(
    gate && Boolean(session && currentAction),
    session && currentAction ? { session, action: currentAction } : null,
    panelRevealCloseMs(),
  );
  const view = presence.data;
  const displayedSession = view?.session ?? session;
  const action = view?.action;
  const lockedCharId = lockedTarget(displayedSession, action);
  useEffect(() => {
    setSelectedChar(null);
  }, [action?.kind]);
  useEffect(() => {
    if (currentAction) setDrawSettled(false);
  }, [currentAction]);
  const effectiveCharId = lockedCharId ?? selectedChar;
  const pendingDraw = action?.kind === "forgeDraw" && effectiveCharId ? characters[effectiveCharId]?.pendingDraw ?? null : null;

  const liveLockedId = currentAction?.kind === "forgeDraw" ? lockedTarget(session, currentAction) : null;
  const liveDrawKey = session?.pendingActions.length ?? 0;
  const liveHasDraw = Boolean(liveLockedId && characters[liveLockedId]?.pendingDraw);
  useEffect(() => {
    if (!liveLockedId) {
      autoDrawRef.current = null;
      setAutoDrawKey(null);
      return;
    }
    if (!gate || liveHasDraw || autoDrawRef.current === liveDrawKey) return;
    autoDrawRef.current = liveDrawKey;
    setAutoDrawKey(liveDrawKey);
    startTaintedDraw(liveLockedId);
  }, [gate, liveLockedId, liveHasDraw, liveDrawKey, startTaintedDraw]);
  // 自动锻造尚未开始的这一帧不显示面板, 避免闪出选人页。
  const awaitingAutoDraw = Boolean(liveLockedId && !liveHasDraw && autoDrawKey !== liveDrawKey);
  const drawOptions = useMemo<CardPickOption[] | null>(
    () => pendingDraw?.length ? pendingDraw.map((cardId, index) => ({ key: `${index}-${cardId}`, card: makeCard(cardId) })) : null,
    [pendingDraw],
  );
  if (!presence.mounted || !displayedSession || !action) return null;

  const selectableCharacters = displayedSession.party.filter((member) => member.alive);
  const chosenCharId = effectiveCharId && characters[effectiveCharId] ? effectiveCharId : null;
  const lockedName = lockedCharId ? displayedSession.party.find((member) => member.charId === lockedCharId)?.name : null;
  const chosenCharacter = chosenCharId ? characters[chosenCharId] : null;
  const detailStage = action.kind === "forgeDraw"
    ? Boolean(chosenCharacter?.pendingDraw)
    : (action.kind === "forgeRemove" || action.kind === "cureQuirk" || action.kind === "purifyCards")
      ? Boolean(chosenCharacter)
      : false;
  const finish = () => resolvePendingAction();
  const settleDraw = () => {
    setDrawSettled(true);
    finish();
  };
  const drawPicker = (
    <CardRewardPicker
      options={drawOptions}
      kicker="成长协议 / 奖励"
      title="角色卡牌奖励"
      caption="三张候选卡牌已经生成，选择一张加入卡组。"
      skipLabel="放弃选择"
      onConfirm={(option) => {
        if (!chosenCharId) return false;
        pickDraw(chosenCharId, option.card.id);
        settleDraw();
      }}
      onSkip={() => {
        if (chosenCharId) cancelDraw(chosenCharId);
        settleDraw();
      }}
    />
  );
  // 退场期间(队列已清空)也保持关闭, 让置换弹窗自己播完退场动画。
  const replaceAction = action.kind === "replaceCard" && !presence.closing ? action : null;
  // 弹窗与面板并列常驻同一位置, 弹窗关闭时才能播完退场动画(不因分支切换被直接卸载)。
  const hidePanel = Boolean(drawOptions) || drawSettled || awaitingAutoDraw || action.kind === "replaceCard";

  return (
    <>
      {drawPicker}
      <CardReplaceModal action={replaceAction} members={selectableCharacters} lockedCharId={lockedCharId} onReplace={replaceExploreCard} onFinish={finish} />
      {!hidePanel && (
        <div className={s["reward-layer"]} data-closing={presence.closing || undefined}>
          <section
            className={cx(s["reward-panel"], s["panel-reveal"])}
            data-guide-anchor="reward-panel"
            data-closing={presence.closing || undefined}
            style={panelRevealVars()}
            aria-label="事件奖励"
          >
            <span className={s["panel-bar"]} aria-hidden />
            <span className={s["panel-scan"]} aria-hidden />
            <EventPanelFrame
              accent={REWARD_ACCENT}
              kicker="成长协议 / 奖励"
              title={titleOf(action.kind)}
              status={<span className={s["reward-step"]}>{lockedName ? `目标：${lockedName}` : "待处理奖励"}</span>}
              contentKey={`${action.kind}-${detailStage ? "detail" : "pick"}`}
            >
              {action.kind === "expOne" && (
                <CharacterPicker
                  members={selectableCharacters}
                  selected={chosenCharId}
                  onSelect={setSelectedChar}
                  caption={`选择一名存活角色，获得 ${action.amount} 点经验。`}
                  onSkip={finish}
                  onConfirm={() => {
                    if (!chosenCharId) return;
                    grantExpTo(chosenCharId);
                    finish();
                  }}
                />
              )}

              {action.kind === "forgeDraw" && (
                <FreeDraw
                  locked={Boolean(lockedCharId)}
                  members={selectableCharacters}
                  selected={chosenCharId}
                  character={chosenCharacter}
                  onSelect={setSelectedChar}
                  onStart={() => {
                    if (chosenCharId) startTaintedDraw(chosenCharId);
                  }}
                  onSkip={finish}
                  onAbandon={() => {
                    if (chosenCharId) cancelDraw(chosenCharId);
                    finish();
                  }}
                />
              )}

              {action.kind === "forgeRemove" && (
                <FreeRemove
                  members={selectableCharacters}
                  selected={chosenCharId}
                  character={chosenCharacter}
                  onSelect={setSelectedChar}
                  onSkip={finish}
                  onRemove={(uid) => {
                    if (!chosenCharId) return;
                    removeCardFree(chosenCharId, uid);
                    finish();
                  }}
                />
              )}

              {action.kind === "equipOffer" && (
                <EquipOffers
                  offers={action.offers}
                  onPick={(index) => {
                    acceptEquipOffer(index);
                    finish();
                  }}
                  onSkip={finish}
                />
              )}

              {action.kind === "relicOffer" && (
                <RelicOffers
                  offers={action.offers}
                  onPick={(index) => {
                    acceptRelicOffer(index);
                    finish();
                  }}
                />
              )}

              {action.kind === "equipmentTune" && <EquipmentTuneReward session={displayedSession} action={action} onFinish={finish} />}

              {action.kind === "reforge" && (
                <ReforgePicker
                  backpack={displayedSession.backpack}
                  characters={party.map((id) => ({ charId: id, character: characters[id] })).filter(
                    (entry): entry is { charId: string; character: NonNullable<typeof entry.character> } =>
                      Boolean(entry.character),
                  )}
                  bias={action.bias}
                  onBackpack={(uid) => {
                    reforgeBackpackItem(uid);
                    finish();
                  }}
                  onEquipped={(charId, slot) => {
                    reforgeEquipped(charId, slot, action.bias);
                    finish();
                  }}
                  onSkip={finish}
                />
              )}

              {action.kind === "healOne" && (
                <CharacterPicker
                  members={selectableCharacters}
                  selected={chosenCharId}
                  onSelect={setSelectedChar}
                  caption={action.full ? "选择一名存活角色，将当前生命恢复至体力极限。" : `选择一名存活角色，回复 ${Math.round(action.percent * 100)}% 当前生命。`}
                  onSkip={finish}
                  onConfirm={() => {
                    if (chosenCharId) resolvePendingHeal(chosenCharId, false);
                  }}
                />
              )}

              {action.kind === "healLimitOne" && (
                <CharacterPicker
                  members={selectableCharacters}
                  selected={chosenCharId}
                  onSelect={setSelectedChar}
                  caption={action.full ? "选择一名存活角色，将体力极限恢复至基础最大生命。" : `选择一名存活角色，修复 ${Math.round(action.percent * 100)}% 体力极限。`}
                  onSkip={finish}
                  onConfirm={() => {
                    if (chosenCharId) resolvePendingHeal(chosenCharId, true);
                  }}
                />
              )}

              {action.kind === "cureQuirk" && (
                action.scope === "party" ? (
                  <PartyReward
                    caption={`全队存活角色各治疗 ${action.count} 个怪癖。`}
                    onSkip={finish}
                    onConfirm={() => resolvePendingQuirk()}
                  />
                ) : (
                  <QuirkReward
                    members={selectableCharacters}
                    selected={chosenCharId}
                    character={chosenCharacter}
                    count={action.count}
                    onSelect={setSelectedChar}
                    onSkip={finish}
                    onConfirm={(quirkId) => resolvePendingQuirk(chosenCharId ?? undefined, quirkId)}
                  />
                )
              )}

              {action.kind === "reducePollution" && (
                action.scope === "party" ? (
                  <PartyReward
                    caption={`全队存活角色污染值降低 ${action.amount}。`}
                    onSkip={finish}
                    onConfirm={() => resolvePendingPollution()}
                  />
                ) : (
                  <CharacterPicker
                    members={selectableCharacters}
                    selected={chosenCharId}
                    onSelect={setSelectedChar}
                    caption={`选择一名存活角色，污染值降低 ${action.amount}。`}
                    onSkip={finish}
                    onConfirm={() => {
                      if (chosenCharId) resolvePendingPollution(chosenCharId);
                    }}
                  />
                )
              )}

              {action.kind === "purifyCards" && (
                <PurifyReward
                  members={selectableCharacters}
                  selected={chosenCharId}
                  character={chosenCharacter}
                  scope={action.scope}
                  count={action.count}
                  onSelect={setSelectedChar}
                  onSkip={finish}
                  onConfirm={(uids) => resolvePendingPurification(chosenCharId ?? undefined, uids ?? [])}
                />
              )}
            </EventPanelFrame>
          </section>
        </div>
      )}
    </>
  );
}

/** 待办已锁定交互者且其仍存活时返回其 id; 否则走手动选人。 */
function lockedTarget(session: ExploreState | null | undefined, action: PendingAction | undefined): string | null {
  const actorId = action?.actorId;
  if (!actorId || !session) return null;
  return session.party.some((member) => member.charId === actorId && member.alive) ? actorId : null;
}

function titleOf(kind: string): string {
  switch (kind) {
    case "expOne":
      return "定向训练";
    case "forgeDraw":
      return "角色卡牌奖励";
    case "forgeRemove":
      return "免费卡组整理";
    case "replaceCard":
      return "普通卡替换";
    case "equipOffer":
      return "装备候选";
    case "relicOffer":
      return "遗物候选";
    case "reforge":
      return "羁绊重铸";
    case "equipmentTune":
      return "装备调校";
    case "healOne":
      return "指定角色治疗";
    case "healLimitOne":
      return "指定角色体力极限修复";
    case "cureQuirk":
      return "怪癖治疗";
    case "reducePollution":
      return "污染值降低";
    case "purifyCards":
      return "污染卡净化";
    default:
      return "事件奖励";
  }
}


