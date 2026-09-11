import { useEffect, useRef } from "react";
import { getCharacter } from "@/data";
import { useRevealPresence } from "@/ui/common/ModalReveal";
import { GrowthGlyph } from "./GrowthGlyph";
import { GrowthSummary } from "./GrowthSummary";
import { GrowthUpgrade } from "./GrowthUpgrade";
import { GrowthOperations } from "./GrowthOperations";
import { GrowthSelection } from "./GrowthSelection";
import { useGrowthActions } from "./useGrowthActions";
import s from "./DeckGrowthPanel.module.css";

interface Props { charId: string; onClose: () => void; }

export function DeckGrowthPanel({ charId, onClose }: Props) {
  const actions = useGrowthActions(charId);
  const { cs, model, page, busy } = actions;
  // 滑回总览时保留离场卡牌快照，滑动结束后再卸载，避免空白闪切与常驻大卡组。
  const selection = useRevealPresence(
    page !== "hub",
    cs && model && page !== "hub" ? <GrowthSelection mode={page} cards={page === "draw" ? actions.candidates : cs.deck} selectedUid={actions.selectedUid} cost={model.costs.remove} minDeckSize={cs.minDeckSize} disabled={busy || (page === "remove" && !model.canRemove)} reason={page === "remove" && !model.canRemove ? model.removeDisabledReason : undefined} onSelect={actions.setSelectedUid} onConfirm={actions.confirmSelection} onBack={actions.goBack} /> : null,
    320,
  );
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const backRef = useRef(actions.goBack);
  const pageRef = useRef(page);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  backRef.current = actions.goBack;
  pageRef.current = page;
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (busyRef.current) return;
        if (pageRef.current === "hub") closeRef.current();
        else backRef.current();
      }
      if (event.key === "Tab") {
        const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled), [tabindex='0']") ?? []).filter((node) => !node.closest("[inert]"));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => {
      window.removeEventListener("keydown", handleKey, true);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  // 翻页时将焦点从离场内容移出，避免键盘落在 inert 页面里。
  useEffect(() => { closeButton.current?.focus(); }, [page]);

  if (!cs || !model) return null;
  const pending = Boolean(cs.pendingDraw);
  return <div className={s.layer}>
    <div className={s.scrim} onClick={() => { if (!busy) onClose(); }} />
    <div ref={panel} className={s.panel} role="dialog" aria-modal="true" aria-labelledby="deck-growth-heading">
      <svg className={s.frame} viewBox="0 0 1540 944" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <path className={s.frameGlow} d="M42 8H202l14 12h1080l14-12h188l34 34v180l-8 12v474l8 12v180l-34 36H42L8 900V720l8-12V234L8 222V42Z" />
        <path className={s.frameLine} d="M42 8H202l14 12h1080l14-12h188l34 34v180l-8 12v474l8 12v180l-34 36H42L8 900V720l8-12V234L8 222V42Z" />
        <path className={s.frameInner} d="M46 20h151l14 12h1090l14-12h177l28 28v846l-28 30H48l-28-30V48ZM25 112h1490M50 908h1440" />
      </svg>
      <header className={s.header}>
        <GrowthGlyph kind="draw" /><h2 id="deck-growth-heading">卡组成长</h2>
        <span>{getCharacter(charId).name} · 个人卡组</span>
        <button ref={closeButton} type="button" className={s.close} disabled={busy} onClick={onClose} aria-label="关闭卡组成长">×</button>
      </header>
      <div className={s.content}>
        <GrowthSummary level={cs.deckLevel} exp={cs.exp} cost={model.costs.upgrade} chances={actions.chances} hasPool={model.hasPool} />
        <div className={s.viewport}>
          <div className={s.track} data-detail={page !== "hub"}>
            <div className={s.home} aria-hidden={page !== "hub"} ref={(node) => { if (node) node.inert = page !== "hub"; }}>
              <GrowthUpgrade level={cs.deckLevel} cost={model.costs.upgrade} current={actions.chances} next={actions.nextChances} disabled={busy || !model.canUpgrade} reason={busy ? "成长数据同步中" : !model.canUpgrade ? model.upgradeDisabledReason?.replace(`Lv.${cs.deckLevel}`, `${cs.deckLevel} 级`) : undefined} onUpgrade={actions.upgrade} />
              <GrowthOperations mode="draw" cost={model.costs.draw} disabled={busy || (!pending && !model.canDraw)} reason={!pending && !model.canDraw ? model.drawDisabledReason : undefined} pending={pending} deckSize={cs.deck.length} minDeckSize={cs.minDeckSize} onAction={actions.openDraw} />
              <GrowthOperations mode="remove" cost={model.costs.remove} disabled={busy || !model.canRemove} reason={!model.canRemove ? model.removeDisabledReason : undefined} preview={cs.deck[0]} deckSize={cs.deck.length} minDeckSize={cs.minDeckSize} onAction={actions.openRemove} />
            </div>
            <div className={s.detail} aria-hidden={page === "hub"} ref={(node) => { if (node) node.inert = page === "hub"; }}>
              {selection.mounted && selection.data}
            </div>
          </div>
        </div>
        <div className={s.status} role="status" aria-live="polite">{actions.notice || (pending ? "有待领取的抽卡结果，点击抽卡继续选择" : "升级、抽卡与删卡共用角色经验")}</div>
      </div>
    </div>
  </div>;
}
