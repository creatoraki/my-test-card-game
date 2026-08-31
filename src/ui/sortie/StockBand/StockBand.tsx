import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { getItemDef, SORTIE_STOCK_IDS } from "@/data";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import { COPY_COUNT, MIDDLE_COPY, useInfiniteBand } from "@/ui/sortie/hooks";
import s from "./StockBand.module.css";

interface Props {
  active: boolean;
  className?: string;
  entering: boolean;
  onNoticeChange: (notice: string | null) => void;
  wheelTargetRef: RefObject<HTMLElement>;
}

const WHEEL_GAP_MS = 180;
const NOTICE_MS = 1500;
const STOCK_COUNT = SORTIE_STOCK_IDS.length;

export function StockBand({ active, className, entering, onNoticeChange, wheelTargetRef }: Props) {
  const loot = useTownStore((state) => state.loot);
  const buy = useSortieStore((state) => state.buy);
  // 货柜的选中项是组件内部状态(不像目标层那样由父级持有)
  const [focusIndex, setFocusIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef(0);

  const { virtualIndex, isMoving, isResetting, shift, listRef, select, onListTransitionEnd } =
    useInfiniteBand({
      active,
      count: STOCK_COUNT,
      selectedIndex: focusIndex,
      onSelect: setFocusIndex,
      wheelGapMs: WHEEL_GAP_MS,
      wheelTarget: wheelTargetRef,
    });

  useEffect(() => {
    onNoticeChange(notice);
  }, [notice, onNoticeChange]);

  useEffect(() => () => window.clearTimeout(noticeTimerRef.current), []);

  const showNotice = useCallback((message: string) => {
    window.clearTimeout(noticeTimerRef.current);
    setNotice(message);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  return (
    <section
      className={cx(s["sb-step"], className)}
      data-active={active}
      data-moving={isMoving}
      aria-hidden={!active}
      aria-busy={isMoving}
      aria-label="货柜"
    >
      <div className={cx(s["sb-band"], entering && s["sb-band-enter"])}>
        <div
          ref={listRef}
          className={cx(s["sb-band-list"], isResetting && s["sb-band-list-reset"])}
          style={{ "--shift": shift } as CSSProperties}
          role="listbox"
          aria-label="货柜"
          onTransitionEnd={onListTransitionEnd}
        >
          {Array.from({ length: COPY_COUNT }, (_, copy) =>
            SORTIE_STOCK_IDS.map((itemId, index) => {
              const def = getItemDef(itemId);
              const price = def.buyValue ?? 0;
              const affordable = loot >= price;
              const itemIndex = copy * STOCK_COUNT + index;
              const isCurrent = itemIndex === virtualIndex;
              const isSemantic = copy === MIDDLE_COPY;
              const focused = index === focusIndex;

              return (
                <button
                  key={`${copy}-${itemId}`}
                  className={cx(
                    s["sb-slice"],
                    isCurrent && s["sb-is-on"],
                    !affordable && s["sb-cant"],
                  )}
                  type="button"
                  role={isSemantic ? "option" : undefined}
                  aria-selected={isSemantic ? focused : undefined}
                  aria-hidden={isSemantic ? undefined : true}
                  tabIndex={isSemantic ? 0 : -1}
                  aria-label={`${def.name}，${price} 积分`}
                  onClick={() => {
                    if (!focused) {
                      select(index);
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
            }),
          )}
        </div>
      </div>
    </section>
  );
}

export default StockBand;
