// ★ 事件奖励浮层 ★ —— 事件结算后 pendingActions 逐条弹出的处理面板。
//
// ⚠ 版式不在这里: 外框取自 explorePanel 的 panel-box(在 rewardKit 里缩到 1120×780), 页眉/正文/底栏/按钮/选择卡
//   全部来自 ui/common/EventPanel 的原语 —— 与落点事件面板同一套设计语言,
//   这样「选完选项 → 弹出奖励」时页眉基线与按钮行不会跳。
//   本文件只负责: 奖励种类 → 内容与文案。
import { useEffect, useState } from "react";
import type { ExploreState, PendingAction } from "@/explore/types";
import { useTownStore } from "@/store/town/townStore";
import { useExploreStore } from "@/store/explore/exploreStore";
import { useRunStore } from "@/store/run/runStore";
import { cx } from "@/ui/common/shared/cx";
import { useRevealPresence } from "@/ui/common/frame/ModalReveal";
import { EventPanelFrame } from "@/ui/common/widget/EventPanel";
import { panelRevealCloseMs, panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { DOSSIER_ACCENT } from "@/ui/explore/EventDossier";
import RelicOffers from "./RelicOffers";
import { ReplaceCardReward } from "./ReplaceCardReward";
import { EquipmentTuneReward } from "./EquipmentTuneReward";
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

  const currentAction = session?.pendingActions[0];
  const presence = useRevealPresence<RewardView | null>(
    gate && Boolean(session && currentAction),
    session && currentAction ? { session, action: currentAction } : null,
    panelRevealCloseMs(),
  );
  const view = presence.data;
  const displayedSession = view?.session ?? session;
  const action = view?.action;
  useEffect(() => {
    setSelectedChar(null);
  }, [action?.kind]);
  if (!presence.mounted || !displayedSession || !action) return null;

  const selectableCharacters = displayedSession.party.filter((member) => member.alive);
  const chosenCharId = selectedChar && characters[selectedChar] ? selectedChar : null;
  const chosenCharacter = chosenCharId ? characters[chosenCharId] : null;
  const detailStage = action.kind === "forgeDraw"
    ? Boolean(chosenCharacter?.pendingDraw)
    : (action.kind === "forgeRemove" || action.kind === "cureQuirk" || action.kind === "purifyCards" || action.kind === "replaceCard")
      ? Boolean(chosenCharacter)
      : false;
  const finish = () => resolvePendingAction();

  return (
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
          status={<span className={s["reward-step"]}>待处理奖励</span>}
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
              onPick={(cardId) => {
                if (!chosenCharId) return;
                pickDraw(chosenCharId, cardId);
                finish();
              }}
            />
          )}

          {action.kind === "replaceCard" && (
            <ReplaceCardReward
              members={selectableCharacters}
              selected={chosenCharId}
              onSelect={setSelectedChar}
              onSkip={finish}
              foodCost={action.foodCost ?? 0}
              onReplace={replaceExploreCard}
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
  );
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


