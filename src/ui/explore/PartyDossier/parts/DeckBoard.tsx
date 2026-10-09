// 「卡组」页: 个人卡组的只读平铺, 一行固定 3 张。
// CardFace 是 220×308 的固定像素卡面, 列宽由网格 1fr 决定, 这里量出列宽、卡面只占其中 FILL,
// 再反推缩放比交给 CSS —— 卡与卡之间留出呼吸感, 不至于顶满。
// ★ 悬停哪张卡只往上报 uid, 大卡详情由 PartyDossier 画在左栏立绘舞台上(与城镇角色详情同一套)。
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import type { Card } from "@/engine";
import { CardFace } from "@/ui/common/card/CardFace";
import s from "./DeckBoard.module.css";

const CARD_W = 220;
/** 卡面占列宽的比例。 */
const FILL = 0.92;

interface Props {
  deck: Card[];
  hoveredUid: string | null;
  onHoverCard: (uid: string | null) => void;
}

/** 量第一格的宽度 × FILL → 卡面缩放比, 写进网格的 --scale。 */
function useCellScale(count: number) {
  const grid = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    const update = () => {
      const cell = element.firstElementChild as HTMLElement | null;
      if (cell) element.style.setProperty("--scale", String((cell.clientWidth * FILL) / CARD_W));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [count]);
  return grid;
}

export function DeckBoard({ deck, hoveredUid, onHoverCard }: Props) {
  const grid = useCellScale(deck.length);
  if (deck.length === 0) return <p className={s.empty}>该队员暂无卡牌</p>;
  return (
    <div ref={grid} className={s.grid} onMouseLeave={() => onHoverCard(null)}>
      {deck.map((card, index) => (
        <div
          key={card.uid}
          className={s.cell}
          style={{ "--i": Math.min(index, 8) } as CSSProperties}
          data-hovered={hoveredUid === card.uid || undefined}
          onMouseEnter={() => onHoverCard(card.uid)}
        >
          <span className={s.box}>
            <span className={s.card} data-deck-card>
              <CardFace card={card} />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
