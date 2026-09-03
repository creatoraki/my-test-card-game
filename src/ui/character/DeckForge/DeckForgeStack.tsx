import { useCallback, useEffect, useRef, useState } from "react";
import { deckUpgradeCost, RULES } from "@/engine";
import { useTownStore } from "@/store/townStore";
import { DeckForgeHub } from "@/ui/character/DeckForgeHub";
import { DeckForgeOverlay } from "@/ui/character/DeckForgeOverlay";
import { DeckUpgradeOverlay } from "@/ui/character/DeckUpgradeOverlay";
import { useDeckUpgrade } from "@/ui/character/DeckUpgradeOverlay/useDeckUpgrade";
import { useModalReveal } from "@/ui/common/ModalReveal";
import { DeckForgeShell } from "./DeckForgeShell";
import { forgeViewModel } from "./forgeViewModel";
import { type ForgeView } from "./forgeMorph";
import { useForgeMorph } from "./useForgeMorph";

interface Props {
  charId: string;
  view: ForgeView;
  onViewChange: (view: ForgeView) => void;
  onClose: () => void;
}

const EMPTY_POOL = { common: false, uncommon: false, rare: false } as const;

export function DeckForgeStack({ charId, view: initialView, onViewChange, onClose }: Props) {
  const characters = useTownStore((state) => state.characters);
  const day = useTownStore((state) => state.day);
  const upgradeDeck = useTownStore((state) => state.upgradeDeck);
  const forgeDraw = useTownStore((state) => state.forgeDraw);
  const pickDraw = useTownStore((state) => state.pickDraw);
  const cancelDraw = useTownStore((state) => state.cancelDraw);
  const removeCard = useTownStore((state) => state.removeCard);
  const cs = characters[charId];
  const model = cs ? forgeViewModel(cs, day) : null;
  const { view, phase, busy: morphBusy, switchTo } = useForgeMorph(initialView, onViewChange);
  const [stageBusy, setStageBusy] = useState(false);
  const currentView = cs
    ? view === "upgrade"
      ? {
          level: cs.deckLevel,
          exp: cs.exp,
          upgradeCost: model?.costs.upgrade ?? null,
          nextUpgradeCost: deckUpgradeCost(cs.deckLevel + 1),
          deckSize: cs.deck.length,
          minDeckSize: cs.minDeckSize,
          hasPool: model?.hasPool ?? EMPTY_POOL,
        }
      : null
    : null;
  const handleConfirmUpgrade = useCallback(() => {
    upgradeDeck(charId);
  }, [charId, upgradeDeck]);
  const upgrade = useDeckUpgrade({
    ...(currentView ?? {
      level: 0,
      exp: 0,
      upgradeCost: null,
      nextUpgradeCost: null,
      deckSize: 0,
      minDeckSize: 0,
      hasPool: EMPTY_POOL,
    }),
    levelMax: RULES.deck.levelMax,
    canUpgrade: model?.canUpgrade ?? false,
    onConfirm: handleConfirmUpgrade,
  });
  const contentBusy = view === "draw" || view === "remove"
    ? stageBusy
    : view === "upgrade"
      ? upgrade.busy
      : false;
  const busy = morphBusy || contentBusy;
  const { closing, requestClose: requestModalClose } = useModalReveal(onClose, busy);
  const viewRef = useRef(view);
  viewRef.current = view;

  const switchView = useCallback(
    (next: ForgeView) => {
      if (busy || closing) return;
      if (viewRef.current === "draw" && next !== "draw") cancelDraw(charId);
      switchTo(next);
    },
    [busy, cancelDraw, charId, closing, switchTo],
  );

  const completeView = useCallback(() => {
    if (viewRef.current === "draw") cancelDraw(charId);
    switchTo("hub");
  }, [cancelDraw, charId, switchTo]);

  const requestClose = useCallback(() => {
    if (busy || closing) return;
    if (viewRef.current !== "hub") {
      switchView("hub");
      return;
    }
    requestModalClose();
  }, [busy, closing, requestModalClose, switchView]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || busy || closing) return;
      if (viewRef.current !== "hub") {
        switchView("hub");
        return;
      }
      requestModalClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, closing, requestModalClose, switchView]);

  useEffect(() => {
    return () => {
      if (viewRef.current === "draw") cancelDraw(charId);
    };
  }, [cancelDraw, charId]);

  if (!cs || !model) return null;

  const ariaLabel = view === "hub"
    ? "卡组锻造"
    : view === "draw"
      ? "扩充卡组"
      : view === "remove"
        ? "精简卡组"
        : "卡组升级";

  return (
    <DeckForgeShell
      view={view}
      phase={phase}
      closing={closing}
      busy={busy}
      ariaLabel={ariaLabel}
      className={view === "upgrade" ? upgrade.rootClassName : undefined}
      style={view === "upgrade" ? upgrade.rootStyle : undefined}
      onBackdrop={requestClose}
    >
      {view === "hub" && (
        <DeckForgeHub
          deckSize={cs.deck.length}
          deckLevel={cs.deckLevel}
          minDeckSize={cs.minDeckSize}
          exp={cs.exp}
          costs={model.costs}
          canDraw={model.canDraw}
          canRemove={model.canRemove}
          canUpgrade={model.canUpgrade}
          busy={busy}
          drawDisabledReason={model.drawDisabledReason}
          removeDisabledReason={model.removeDisabledReason}
          upgradeDisabledReason={model.upgradeDisabledReason}
          onDraw={() => switchView("draw")}
          onRemove={() => switchView("remove")}
          onUpgrade={() => switchView("upgrade")}
          onRequestClose={requestClose}
        />
      )}
      {(view === "draw" || view === "remove") && (
        <DeckForgeOverlay
          mode={view}
          pendingDraw={cs.pendingDraw}
          deck={cs.deck}
          minDeckSize={cs.minDeckSize}
          drawCost={model.costs.draw}
          exp={cs.exp}
          deckLevel={cs.deckLevel}
          deckSize={cs.deck.length}
          hasPool={model.hasPool}
          canConfirmDraw={model.canDraw}
          drawDisabledReason={model.drawDisabledReason}
          onStartDraw={() => forgeDraw(charId)}
          onPickDraw={(cardDefId) => pickDraw(charId, cardDefId)}
          onRemoveCard={(uid) => removeCard(charId, uid)}
          onComplete={completeView}
          onClose={requestClose}
          onBusyChange={setStageBusy}
          busy={busy}
        />
      )}
      {view === "upgrade" && <DeckUpgradeOverlay state={{ ...upgrade, busy }} onClose={requestClose} />}
    </DeckForgeShell>
  );
}
