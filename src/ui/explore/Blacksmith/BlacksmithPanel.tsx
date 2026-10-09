import { useCallback, useEffect, useMemo, useState } from "react";
import { cardDisplayName, type Card } from "@/engine";
import type { ExploreState } from "@/explore/types";
import { BLACKSMITH_SERVICES, type BlacksmithService } from "@/explore/curio/blacksmithTypes";
import { serviceFoodCount } from "@/explore/curio/foodPayment";
import { useTownStore } from "@/store/town/townStore";
import type { CharacterState } from "@/store/town/townTypes";
import { activeBlacksmith, blacksmithCardReason, blacksmithCharacterReason, blacksmithServiceReason } from "@/store/explore/blacksmithRules";
import {
  abandonBlacksmithService, openBlacksmith, payBlacksmithService, performBlacksmithService, pickBlacksmithDraw,
} from "@/store/explore/blacksmithActions";
import { closeCorridorObject } from "@/store/explore/exploreCorridor";
import { CardRewardPicker, type CardPickOption } from "@/ui/common/card/CardRewardPicker";
import { DeckServiceModal } from "../CardReplace";
import { DossierChoice, DossierInfoBox, DossierNotice, DossierResult, EventDossierPanel, type DossierAction } from "../EventDossier";

/**
 * 锻造师是独立事件：事件页选服务即扣除临期食品并锁定。
 * 换牌 / 删牌 / 复制随后弹出卡组面板选人选卡; 抽牌不选人, 直接弹出全队混合三选一(期间事件页让位)。
 * 付费后可放弃，但不退款。
 */
export function BlacksmithPanel({ session }: { session: ExploreState }) {
  const characters = useTownStore(state => state.characters);
  // 卡组面板结算后继续停留展示结果，点「完成」才回到事件页。
  const [showResult, setShowResult] = useState(false);
  const forge = activeBlacksmith(session)?.blacksmith;
  useEffect(() => { openBlacksmith(); }, [session.phase, session.corridor?.activeObjectId]);
  const members = session.party.filter(member => member.alive);
  const room = session.dungeon?.rooms[session.dungeon.currentRoomId];
  const service: BlacksmithService = forge?.selected ?? "replace";
  const deckService = service === "draw" ? "replace" : service;
  const paid = forge?.status === "paid";
  const completed = forge?.status === "completed";
  const deckOpen = service !== "draw" && Boolean(forge?.selected) && (paid || (completed && showResult && Boolean(forge?.result)));
  const drawing = forge?.status === "drawing";
  const busy = paid || drawing;
  const offers = drawing ? forge?.offers : undefined;
  const drawOptions = useMemo<CardPickOption[] | null>(
    () => offers?.length ? offers.map(offer => ({ key: offer.card.uid, card: offer.card, ownerCharId: offer.charId })) : null,
    [offers],
  );
  const cardReason = useCallback((character: CharacterState, card: Card) => blacksmithCardReason(character, deckService, card), [deckService]);
  const characterReason = useCallback((character: CharacterState) => blacksmithCharacterReason(character, deckService), [deckService]);

  const confirm = (charId: string, uid: string) => {
    if (service === "draw") return false;
    const success = performBlacksmithService(service, charId, uid);
    if (success) setShowResult(true);
    return success;
  };

  const leave: DossierAction = { id: "leave", label: completed ? "离开锻造师" : "暂不交易，继续前进", icon: "leave", sfx: "back", onClick: closeCorridorObject };
  const actions: DossierAction[] = forge?.status === "available" ? [
    ...forge.services.map(kind => {
      const info = BLACKSMITH_SERVICES[kind];
      const reason = blacksmithServiceReason(session, characters, kind);
      return {
        id: kind, label: info.name, icon: "upgrade" as const,
        cost: reason ? `临期食品${info.food}份 · ${reason}` : `任意临期食品${info.food}份`,
        costTone: reason ? "red" as const : "cyan" as const,
        disabled: Boolean(reason), onClick: () => { payBlacksmithService(kind); },
      };
    }), leave,
  ] : completed ? [leave] : [];
  const resultNotes = forge?.selected ? [`已消耗临期食品${BLACKSMITH_SERVICES[forge.selected].food}份。`] : [];
  if (completed && !forge?.result) resultNotes.push("服务已中途放弃，临期食品不予退还。");
  if (forge?.result?.before) resultNotes.push(`原卡牌：${cardDisplayName(forge.result.before)}${forge.selected === "copy" ? "，保留原样。" : "，已连同模组移除。"}`);
  if (forge?.result?.after) resultNotes.push(`已获得「${cardDisplayName(forge.result.after)}」。`);

  return <>
    {!drawing && <EventDossierPanel theme="blacksmith" kicker={`锻造师 · ${room?.label ?? ""}号房间`} title="锻造师" enTitle="卡组锻造服务"
      contentKey={forge?.status ?? "preparing"} active={!deckOpen && !busy}
      onClose={busy ? undefined : closeCorridorObject}>
      {completed ? <DossierResult story={["锻造师收起工具，本次服务已结束。", "另一项服务不再可用。"]} notes={resultNotes} actions={actions} />
        : <DossierChoice lines={[
          "炉火映亮了锻造师的面罩，他向小队展示了本次可用的两种服务。",
          "每次相遇只能选择一种服务，选择后立即收取临期食品，可以混付。",
          ...(forge?.services.map(kind => `${BLACKSMITH_SERVICES[kind].name}：${BLACKSMITH_SERVICES[kind].description}`) ?? ["锻造师正在准备服务……"]),
        ]} info={<DossierInfoBox><DossierNotice title={`可用临期食品 ${serviceFoodCount(session)} 份`} note="打开与离开不消耗净化粒子。付费后中途放弃不退款。" /></DossierInfoBox>} actions={actions} />}
    </EventDossierPanel>}
    <DeckServiceModal mode={deckService} open={deckOpen} result={showResult ? forge?.result ?? null : null}
      members={members} lockedCharId={null}
      kicker={`锻造师 · ${BLACKSMITH_SERVICES[deckService].name}`} paymentNote={`已支付临期食品${BLACKSMITH_SERVICES[deckService].food}份`}
      cardReason={cardReason} characterReason={characterReason} onConfirm={confirm}
      onFinish={() => setShowResult(false)} onAbandon={abandonBlacksmithService} abandonLabel="放弃服务（不退款）" />
    <CardRewardPicker options={drawOptions} title="锻造师 · 三选一抽牌" kicker={`已支付临期食品${BLACKSMITH_SERVICES.draw.food}份`}
      caption="候选来自全队卡池，选择一张加入对应角色的卡组；本次相遇的另一项服务已失效。" skipLabel="放弃（不退款）"
      onConfirm={option => pickBlacksmithDraw(option.card.uid)} onSkip={abandonBlacksmithService} />
  </>;
}
