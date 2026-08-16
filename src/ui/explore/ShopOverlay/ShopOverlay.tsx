import { landedEvent, landedShop } from "@/explore/session";
import type { ExploreState, NodeEvent, ShopState } from "@/explore/types";
import { useExploreStore } from "@/store/exploreStore";
import { useRevealPresence } from "@/ui/common/ModalReveal";
import { EventPanelFrame } from "@/ui/common/EventPanel";
import MerchantPanel from "@/ui/explore/MerchantPanel";
import { panelRevealCloseMs, panelRevealVars } from "@/ui/explore/styles/panelReveal";
import s from "./ShopOverlay.module.css";

interface ShopView {
  session: ExploreState;
  shop: ShopState;
  event: NodeEvent;
}

export default function ShopOverlay() {
  const session = useExploreStore((state) => state.session);
  const buyFromShop = useExploreStore((state) => state.buyFromShop);
  const closeShop = useExploreStore((state) => state.closeShop);

  const shop = session?.phase === "shopping" ? landedShop(session) : null;
  const event = session?.phase === "shopping" ? landedEvent(session) : null;
  const presence = useRevealPresence<ShopView | null>(
    Boolean(session && session.phase === "shopping" && shop && event),
    session && shop && event ? { session, shop, event } : null,
    panelRevealCloseMs(),
  );
  const view = presence.data;
  if (!presence.mounted || !view) return null;

  const { session: displayedSession, shop: displayedShop, event: displayedEvent } = view;

  const canClose =
    !displayedSession.pendingPickup.length &&
    !displayedSession.pendingLoot.length &&
    !displayedSession.pendingActions.length;

  return (
    <div className={s.layer} data-closing={presence.closing || undefined}>
      <section
        className={`${s.panel} ${s["panel-reveal"]}`}
        data-closing={presence.closing || undefined}
        style={panelRevealVars()}
        aria-label="交易终端"
      >
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s.frame} aria-hidden />
        <span className={s.scan} aria-hidden />
        <EventPanelFrame
          accent="#d6b477"
          kicker="交易终端 / SHOPPING"
          title={displayedEvent.title}
          status={<span className={s.step}>已成交 {displayedShop.trades} / {displayedShop.slots.length}</span>}
          contentKey={`shop-${displayedEvent.id}`}
        >
          <div className={s.stage}>
            <div className={s.body}>
              <MerchantPanel
                session={displayedSession}
                shop={displayedShop}
                onBuy={buyFromShop}
                canClose={canClose}
                onClose={closeShop}
              />
            </div>
            <div className={s.notes} aria-live="polite">
              {displayedSession.pendingNotes.length ? (
                displayedSession.pendingNotes.map((note, index) => <span key={`${note}-${index}`}>{note}</span>)
              ) : (
                <span className={s.muted}>本节点尚未产生额外记录。</span>
              )}
            </div>
          </div>
        </EventPanelFrame>
      </section>
    </div>
  );
}
