import { useState } from "react";
import type { ExploreState } from "@/explore/types";
import type { Card } from "@/engine";
import { HandCard } from "@/ui/battle/HandCard";
import { PartyMemberCard } from "@/ui/common/PartyMemberCard";
import {
  EventPanelBody,
  EventPanelButton,
  EventPanelFoot,
  EventPanelNotice,
  EventPanelStage,
} from "@/ui/common/EventPanel";
import { useTownStore } from "@/store/townStore";
import { useExploreStore } from "@/store/exploreStore";
import { serviceFoodCount } from "@/explore/curio/foodPayment";
import { availablePools } from "@/store/deckCards";
import s from "@/ui/explore/styles/rewardKit.module.css";

export function ReplaceCardReward({
  members,
  selected,
  onSelect,
  onReplace,
  onSkip,
  foodCost = 0,
}: {
  members: ExploreState["party"];
  selected: string | null;
  onSelect: (charId: string) => void;
  onReplace: (charId: string, uid: string) => void;
  onSkip: () => void;
  foodCost?: number;
}) {
  const characters = useTownStore((state) => state.characters);
  const foodCount = useExploreStore(state => state.session ? serviceFoodCount(state.session) : 0);
  const [cardUid, setCardUid] = useState<string | null>(null);
  const character = selected ? characters[selected] : null;
  const cards = character ? character.deck.filter(card => availablePools({ ...character,
    deck: character.deck.filter(other => other.uid !== card.uid),
  }).common.some(id => id !== card.id)) : [];
  if (!character) {
    return <EventPanelStage>
      <EventPanelBody caption="先选择一名角色，再从他的卡组中选择要替换的卡牌。" scroll={false}>
        {members.length ? <div className={s["pick-list"]}>{members.map((member) => <PartyMemberCard
          key={member.charId} as="button" charId={member.charId} emoji={member.emoji} name={member.name}
          hp={member.hp} hpLimit={member.hpLimit} maxHp={member.maxHp}
          pollution={characters[member.charId]?.pollution ?? 0} down={!member.alive}
          className={s["member-choice"]} onClick={() => onSelect(member.charId)}
        />)}</div> : <EventPanelNotice>当前没有可处理的角色卡组。</EventPanelNotice>}
      </EventPanelBody>
      <EventPanelFoot note={members.length ? "请选择角色" : "奖励无法执行"}>
        <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>;
  }
  return <EventPanelStage>
    <EventPanelBody caption={`选择一张卡牌，它会被一张随机普通卡替换，原卡模组一并移除。消耗任意食品 ${foodCost} 份，当前 ${foodCount} 份。`} scroll>
      {cards.length ? <div className={s["card-list"]} data-pick-grid>{cards.map((card: Card, index) => <div
        key={card.uid} className={`${s["card-choice"]} ${cardUid === card.uid ? s["is-selected"] : ""}`}
        onClick={() => setCardUid(card.uid)}
      ><HandCard card={card} variant="pile" playable selected={cardUid === card.uid} dealDelay={Math.min(index, 14) * 22} /></div>)}</div>
        : <EventPanelNotice>该角色没有可替换的卡牌。</EventPanelNotice>}
    </EventPanelBody>
    <EventPanelFoot note={cardUid ? "普通卡替换目标已锁定" : "请选择一张卡牌"}>
      <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
      <EventPanelButton tone="primary" disabled={!cards.some(card => card.uid === cardUid) || foodCount < foodCost} onClick={() => cardUid && onReplace(character.charId, cardUid)}>确认替换</EventPanelButton>
    </EventPanelFoot>
  </EventPanelStage>;
}

