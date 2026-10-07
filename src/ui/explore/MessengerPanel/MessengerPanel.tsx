import { useEffect, useRef, useState } from "react";
import { getItemDef } from "@/data";
import { EXPLORE_RULES } from "@/explore/core/exploreRules";
import { isMessengerFood, type MessengerFoodPick } from "@/explore/curio/messenger";
import { canShipHome } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import { MessengerActionButton } from "./MessengerActionButton";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { MESSENGER_ART, MESSENGER_FOOD_IDS } from "./messengerArt";
import { MessengerFoodCard, MessengerGlyph, MessengerSlot } from "./MessengerParts";
import s from "./MessengerPanel.module.css";
import { useMessengerDismiss } from "./useMessengerDismiss";

export function MessengerPanel({ backpack, shipped, onSend, onClose }: {
  backpack: ItemStack[];
  shipped: ItemStack[];
  onSend: (uids: string[], food: MessengerFoodPick[]) => void;
  onClose: () => void;
}) {
  const [shipping, setShipping] = useState<string[]>([]);
  const [food, setFood] = useState<MessengerFoodPick[]>([]);
  const [showParcel, setShowParcel] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const { closing, dismiss } = useMessengerDismiss();
  const close = () => dismiss(onClose);
  const count = backpack.reduce((sum, stack) => sum + (shipping.includes(stack.uid) ? stack.count : 0), 0);
  const foodCount = food.reduce((sum, pick) => sum + pick.count, 0);
  const parcelCount = shipped.reduce((sum, stack) => sum + stack.count, 0);
  const rules = EXPLORE_RULES.chute;
  const canSend = count > 0 && count <= rules.maxItems && foodCount === rules.foodCost;
  const foods = MESSENGER_FOOD_IDS.flatMap<{ itemId: string; stack?: ItemStack }>(itemId => {
    const stacks = backpack.filter(stack => stack.itemId === itemId && isMessengerFood(stack));
    return stacks.length ? stacks.map(stack => ({ itemId, stack })) : [{ itemId, stack: undefined }];
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => previous?.focus();
  }, []);

  function toggleShip(stack: ItemStack) {
    setShipping(current => current.includes(stack.uid) ? current.filter(uid => uid !== stack.uid) : [...current, stack.uid]);
  }
  function changeFood(stack: ItemStack, amount: number) {
    setFood(current => {
      const selected = current.find(pick => pick.uid === stack.uid)?.count ?? 0;
      const total = current.reduce((sum, pick) => sum + pick.count, 0);
      const next = selected + amount;
      if (shipping.includes(stack.uid) || next < 0 || next > stack.count || total + amount > rules.foodCost) return current;
      return [...current.filter(pick => pick.uid !== stack.uid), ...(next ? [{ uid: stack.uid, count: next }] : [])];
    });
  }

  return <div className={s.overlay} data-closing={closing} ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="messenger-title"
    onKeyDown={event => {
      event.stopPropagation();
      if (closing) { event.preventDefault(); return; }
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        const first = buttons?.[0];
        const last = buttons?.length ? buttons[buttons.length - 1] : undefined;
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }
    }}>
    <div className={s.glyphLibrary} aria-hidden="true" dangerouslySetInnerHTML={{ __html: MESSENGER_ART.glyphs }} />
    <section className={`${s.panel} ${s.reveal}`} data-closing={closing} style={panelRevealVars()}>
      <span className={s.revealBar} aria-hidden="true" />
      <div className={s.panelBackground} aria-hidden="true">
        <img className={s.background} src={MESSENGER_ART.background} alt="" />
      </div>
      <header className={s.header}>
        <img className={s.messenger} src={MESSENGER_ART.messenger} alt="" draggable={false} />
        <div className={s.brand}>
          <h1 id="messenger-title">羽翼信使</h1>
          <div className={s.service}>回城投递服务</div>
        </div>
        <p className={s.slogan}>美味即刻启程，<br />由我，为你送达。</p>
        <button type="button" className={s.close} onClick={close} aria-label="关闭投递面板"><MessengerGlyph name="关闭" /></button>
      </header>
      <div className={s.body}>
        <section className={s.zone} aria-label="背包投递选择">
          <div className={s.zoneHeading}>
            <MessengerGlyph name="背包" /><h2>背包</h2><span className={s.shippingCount} aria-live="polite">已选 {count}/{rules.maxItems} 件</span><span className={s.ruleLine} />
            <strong>{backpack.length}/{Math.max(24, backpack.length)}</strong>
          </div>
          <div className={s.backpackGrid}>
            {Array.from({ length: Math.max(24, backpack.length) }, (_, index) => {
              const stack = backpack[index];
              return <MessengerSlot key={stack?.uid ?? `empty-${index}`} stack={stack}
                selected={Boolean(stack && shipping.includes(stack.uid))}
                disabled={Boolean(stack && (!canShipHome(stack, getItemDef(stack.itemId)) || food.some(pick => pick.uid === stack.uid)
                  || (!shipping.includes(stack.uid) && count + stack.count > rules.maxItems)))}
                onClick={stack ? () => toggleShip(stack) : undefined} />;
            })}
          </div>
        </section>
        <section className={`${s.zone} ${s.paymentZone}`} aria-label="食品支付选择">
          <div className={s.zoneHeading}>
            <MessengerGlyph name="餐具" /><h2>支付食品</h2><span className={s.ruleLine} />
            <strong aria-live="polite">{foodCount}/{rules.foodCost}</strong>
          </div>
          <div className={s.foodGrid}>{foods.map(({ itemId, stack }) => {
            const selected = food.find(pick => pick.uid === stack?.uid)?.count ?? 0;
            const blocked = Boolean(stack && shipping.includes(stack.uid));
            return <MessengerFoodCard key={stack?.uid ?? itemId} itemId={itemId} stack={stack} count={selected} blocked={blocked}
              canAdd={Boolean(stack && !blocked && selected < stack.count && foodCount < rules.foodCost)}
              onChange={amount => { if (stack) changeFood(stack, amount); }} />;
          })}</div>
          <div className={s.actions}>
            <MessengerActionButton disabled={closing} onClick={close} />
            <MessengerActionButton confirm disabled={!canSend || closing}
              onClick={() => { if (canSend) dismiss(() => onSend(shipping, food)); }} />
          </div>
          {parcelCount > 0 && <button type="button" className={s.parcelLink} onClick={() => setShowParcel(value => !value)} aria-expanded={showParcel}>
            {showParcel ? "收起" : "查看"}额外包裹 · {parcelCount} 件
          </button>}
        </section>
      </div>
      {showParcel && <section className={s.parcel} aria-label="已寄送的额外包裹">
        <h2>额外包裹 · 回城后统一结算，团灭也不会丢失</h2>
        <div className={s.parcelGrid}>{shipped.map(stack => <MessengerSlot key={stack.uid} stack={stack} disabled />)}</div>
      </section>}
    </section>
  </div>;
}
