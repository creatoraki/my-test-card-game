// 战斗胜利的额外卡牌奖励: 只做数据适配, 外框/交互/详情全部交给通用的 CardRewardPicker。
import { useMemo } from "react";
import { useExploreStore } from "@/store/explore/exploreStore";
import { useTownStore } from "@/store/town/townStore";
import { makeCard } from "@/data";
import { CardRewardPicker, type CardPickOption } from "@/ui/common/card/CardRewardPicker";

export function VictoryCardOffer() {
  const offers = useExploreStore((state) => state.session?.pendingCardOffer ?? null);
  const clearCardOffer = useExploreStore((state) => state.clearCardOffer);
  const pickPartyDraw = useTownStore((state) => state.pickPartyDraw);

  const options = useMemo<CardPickOption[] | null>(
    () => offers?.map((offer) => ({
      key: `${offer.charId}-${offer.cardDefId}`,
      card: makeCard(offer.cardDefId),
      ownerCharId: offer.charId,
    })) ?? null,
    [offers],
  );

  return (
    <CardRewardPicker
      options={options}
      kicker="额外奖励"
      title="选择一张卡牌"
      caption="候选卡牌将加入对应角色的卡组，也可以放弃本次奖励"
      skipLabel="放弃卡牌"
      onConfirm={(option) => {
        if (!pickPartyDraw(option.ownerCharId ?? option.card.ownerCharId, option.card.id)) return false;
        clearCardOffer();
      }}
      onSkip={clearCardOffer}
    />
  );
}
