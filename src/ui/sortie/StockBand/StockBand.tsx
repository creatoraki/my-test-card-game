import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { getItemDef, SORTIE_STOCK_IDS } from "@/data";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import s from "./StockBand.module.css";

interface Props {
  active: boolean;
  className?: string;
  entering: boolean;
  onNoticeChange: (notice: string | null) => void;
  wheelTargetRef: RefObject<HTMLElement>;
}

const SLICE_STEP = 214;
const WHEEL_GAP_MS = 180;

export function StockBand({ active, className, entering, onNoticeChange, wheelTargetRef }: Props) {
  const loot = useTownStore((state) => state.loot);
  const buy = useSortieStore((state) => state.buy);
  const [focusIndex, setFocusIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const wheelAtRef = useRef(0);

  const step = useCallback((offset: number) => {
    setFocusIndex((currentIndex) =>
      (currentIndex + offset + SORTIE_STOCK_IDS.length) % SORTIE_STOCK_IDS.length,
    );
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
      const next = event.key === "ArrowDown" || event.key === "ArrowRight";
      if (!back && !next) return;
      event.preventDefault();
      step(next ? 1 : -1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, step]);

  useEffect(() => {
    onNoticeChange(notice);
  }, [notice, onNoticeChange]);

  const onWheel = useCallback((event: WheelEvent) => {
    if (!active || event.deltaY === 0) return;
    const now = performance.now();
    if (now - wheelAtRef.current < WHEEL_GAP_MS) return;
    wheelAtRef.current = now;
    step(event.deltaY > 0 ? 1 : -1);
  }, [active, step]);

  useEffect(() => {
    const target = wheelTargetRef.current;
    if (!target) return;
    target.addEventListener("wheel", onWheel);
    return () => target.removeEventListener("wheel", onWheel);
  }, [onWheel, wheelTargetRef]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 1500);
  };

  const focusShift = -(focusIndex + 0.5) * SLICE_STEP;

  return (
    <section
      className={cx(s["sb-step"], className)}
      data-active={active}
      aria-hidden={!active}
      aria-label="货柜"
    >
      <div className={cx(s["sb-band"], entering && s["sb-band-enter"])}>
        <div
          className={s["sb-band-list"]}
          style={{ "--shift": focusShift } as CSSProperties}
          role="listbox"
          aria-label="货柜"
        >
          {SORTIE_STOCK_IDS.map((itemId, index) => {
            const def = getItemDef(itemId);
            const price = def.buyValue ?? 0;
            const affordable = loot >= price;
            const focused = index === focusIndex;
            return (
              <button
                key={itemId}
                className={cx(
                  s["sb-slice"],
                  focused && s["sb-is-on"],
                  !affordable && s["sb-cant"],
                )}
                type="button"
                role="option"
                aria-selected={focused}
                aria-label={`${def.name}，${price} 积分`}
                onClick={() => {
                  if (!focused) {
                    setFocusIndex(index);
                    return;
                  }
                  if (!affordable) {
                    showNotice("积分不足");
                    return;
                  }
                  if (!buy(itemId)) showNotice("背包已满");
                }}
              >
                <span className={s["sb-slice-art"]}>{itemIcon(def)}</span>
                <span className={s["sb-slice-copy"]}>
                  <strong className={s["sb-slice-name"]}>{def.name}</strong>
                  <span className={s["sb-slice-price"]}>{price} 积分</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
