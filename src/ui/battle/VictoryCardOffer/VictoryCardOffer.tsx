import { useExploreStore } from "@/store/exploreStore";
import { useTownStore } from "@/store/townStore";
import { getCharacter, makeCard } from "@/data";
import { HandCard } from "@/ui/battle/HandCard";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
import { cx } from "@/ui/common/cx";
import type { CardOfferCandidate } from "@/explore/types";
import s from "./VictoryCardOffer.module.css";

function OfferCard({ offer, index, onPick }: { offer: CardOfferCandidate; index: number; onPick: (offer: CardOfferCandidate) => void }) {
  const character = getCharacter(offer.charId);
  const card = makeCard(offer.cardDefId);
  return (
    <div
      className={s.candidate}
      data-interactive-hint=""
      style={{ "--offer-delay": `${index * 90}ms`, "--owner-color": character.color } as React.CSSProperties}
      role="button"
      tabIndex={0}
      aria-label={`选择 ${character.name} 的卡牌 ${card.name}`}
      onClick={() => onPick(offer)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onPick(offer);
      }}
    >
      <div className={s.owner}>
        <span className={s.ownerMark} style={{ backgroundColor: character.color }} aria-hidden="true" />
        <span>{character.name}</span>
      </div>
      <span className={s.cardWrap}>
        <HandCard card={card} playable selected={false} variant="pile" />
      </span>
      <InteractiveHint className={s.selectFrame} />
      <span className={s.pickLabel}>选择这张</span>
    </div>
  );
}

export function VictoryCardOffer() {
  const offers = useExploreStore((state) => state.session?.pendingCardOffer ?? null);
  const clearCardOffer = useExploreStore((state) => state.clearCardOffer);
  const pickPartyDraw = useTownStore((state) => state.pickPartyDraw);

  if (!offers) return null;

  const pick = (offer: CardOfferCandidate) => {
    if (pickPartyDraw(offer.charId, offer.cardDefId)) clearCardOffer();
  };

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label="卡牌奖励">
      <section className={s.dialog}>
        <div className={s.head}>
          <span className={s.kicker}>额外奖励</span>
          <h3>选择一张卡牌</h3>
          <p>候选卡牌将加入对应角色的卡组</p>
        </div>
        <div className={cx(s.cardGrid)} data-pick-grid>
          {offers.map((offer, index) => (
            <OfferCard key={`${offer.charId}-${offer.cardDefId}`} offer={offer} index={index} onPick={pick} />
          ))}
        </div>
      </section>
    </div>
  );
}
