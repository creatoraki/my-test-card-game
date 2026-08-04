import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { getItemDef } from "@/data";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import s from "./PurchaseFlight.module.css";

const FLIGHT_DURATION_MS = 760;

export interface PurchaseFlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Props {
  itemId: string;
  source: PurchaseFlightRect;
  target: PurchaseFlightRect;
  onComplete: () => void;
}

export default function PurchaseFlight({ itemId, source, target, onComplete }: Props) {
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => completeRef.current(),
      reduced ? 80 : FLIGHT_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  if (typeof document === "undefined") return null;

  const def = getItemDef(itemId);
  const sourceCenterX = source.left + source.width / 2;
  const sourceCenterY = source.top + source.height / 2;
  const targetCenterX = target.left + target.width / 2;
  const targetCenterY = target.top + target.height / 2;
  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;
  const style = {
    "--purchase-left": `${source.left}px`,
    "--purchase-top": `${source.top}px`,
    "--purchase-width": `${Math.max(1, source.width)}px`,
    "--purchase-height": `${Math.max(1, source.height)}px`,
    "--purchase-dx": `${dx}px`,
    "--purchase-dy": `${dy}px`,
    "--purchase-x-1": `${dx * 0.14}px`,
    "--purchase-y-1": `${dy * 0.08 - 34}px`,
    "--purchase-x-2": `${dx * 0.68}px`,
    "--purchase-y-2": `${dy * 0.62 - 24}px`,
    "--purchase-x-3": `${dx * 0.9}px`,
    "--purchase-y-3": `${dy * 0.88}px`,
  } as CSSProperties;

  return createPortal(
    <span
      className={cx(s["purchase-flight"], s[`sx-r-${def.rarity}`])}
      style={style}
      aria-hidden="true"
    >
      <span className={s["purchase-flight-icon"]}>{itemIcon(def)}</span>
    </span>,
    document.body,
  );
}