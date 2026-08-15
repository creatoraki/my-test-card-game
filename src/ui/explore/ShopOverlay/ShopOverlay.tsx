import { landedEvent, landedShop } from "@/explore/session";
import { useExploreStore } from "@/store/exploreStore";
import MerchantPanel from "@/ui/explore/MerchantPanel";
import s from "./ShopOverlay.module.css";

export default function ShopOverlay() {
  const session = useExploreStore((state) => state.session);
  const buyFromShop = useExploreStore((state) => state.buyFromShop);
  const closeShop = useExploreStore((state) => state.closeShop);

  if (!session || session.phase !== "shopping") return null;
  const shop = landedShop(session);
  const event = landedEvent(session);
  if (!shop || !event) return null;

  const canClose =
    !session.pendingPickup.length &&
    !session.pendingLoot.length &&
    !session.pendingActions.length;

  return (
    <div className={s.layer}>
      <section className={s.panel} aria-label="交易终端">
        <span className={s.frame} aria-hidden />
        <span className={s.scan} aria-hidden />
        <header className={s.head}>
          <span className={s.kicker}>NODE TERMINAL / SHOPPING</span>
          <h2>{event.title}</h2>
        </header>
        <div className={s.body}>
          <MerchantPanel
            session={session}
            shop={shop}
            onBuy={buyFromShop}
            canClose={canClose}
            onClose={closeShop}
          />
        </div>
        <div className={s.notes} aria-live="polite">
          {session.pendingNotes.length ? (
            session.pendingNotes.map((note, index) => <span key={`${note}-${index}`}>{note}</span>)
          ) : (
            <span className={s.muted}>本节点尚未产生额外记录。</span>
          )}
        </div>
      </section>
    </div>
  );
}
