import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ShopDetailAside } from "@/ui/town/shop/ShopDetailAside";
import { ShopCardDetail } from "@/ui/town/shop/ShopCardDetail";
import { CardBack } from "@/ui/common/card/CardBack";
import { InteractiveHint } from "@/ui/common/tooltip/InteractiveHint";
import { DeckCard } from "@/ui/common/card/DeckCard";
import { useBoxSize } from "@/ui/common/frame/HudFrame/useBoxSize";
import { useTownStore } from "@/store/town/townStore";
import { CARD_GROUPS, CARD_CATALOG, cardFor } from "../shared/codexCatalog";
import { CardOwnerTabs } from "./CardOwnerTabs";
import s from "./MuseumCardHall.module.css";

/** 每行固定列数：卡牌按网格实际宽度等比缩放，正好铺满一行。 */
const COLUMNS = 5;
const COLUMN_GAP = 18;
/** 与 tokens.css 的 --card-w 保持一致。 */
const BASE_CARD_W = 220;

export function MuseumCardHall() {
  const recorded = useTownStore((state) => state.codex.cards);
  const [ownerId, setOwnerId] = useState(CARD_GROUPS[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { ref: gridRef, size } = useBoxSize<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const group = CARD_GROUPS.find((entry) => entry.id === ownerId) ?? CARD_GROUPS[0];
  const selected = selectedId && recorded.includes(selectedId) ? cardFor(selectedId) : null;
  const scale = size.width > 0
    ? Math.floor(((size.width - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS / BASE_CARD_W) * 1000) / 1000
    : 1;

  // 切换角色页签后回到列表顶部。
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [ownerId]);

  return (
    <div className={s["hall"]}>
      <section className={s["catalog"]}>
        <div className={s["section-head"]}>
          <div><span className={s["kicker"]}>构筑档案</span><h3>卡牌名录</h3></div>
          <span className={s["count"]}>{recorded.length} / {CARD_CATALOG.length}</span>
        </div>
        <CardOwnerTabs groups={CARD_GROUPS} recorded={recorded} value={group?.id ?? ""} onChange={setOwnerId} />
        <div ref={scrollRef} className={s["scroll"]}>
          <div
            ref={gridRef}
            className={s["card-grid"]}
            style={{ "--deck-card-scale": scale, "--museum-columns": COLUMNS, "--museum-column-gap": `${COLUMN_GAP}px` } as CSSProperties}
          >
            {group?.cards.map((def, index) => (
              <div key={def.id} className={s["card-anchor"]} data-interactive-hint="">
                {recorded.includes(def.id) ? (
                  <DeckCard
                    card={cardFor(def.id)}
                    index={index}
                    selected={selectedId === def.id}
                    focusStyle="zoom"
                    aria-label={`查看${def.name}详情`}
                    onClick={() => setSelectedId(def.id)}
                  />
                ) : (
                  <button
                    type="button"
                    className={s["locked-card"]}
                    aria-label={`未收录卡牌：${def.name}`}
                    onClick={() => setSelectedId(def.id)}
                  >
                    <CardBack />
                  </button>
                )}
                <InteractiveHint className={s["card-hint"]} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <ShopDetailAside heading="卡牌详情" empty="选择已收录卡牌查看详情">
        {selected && <ShopCardDetail card={selected} animKey={selectedId ?? selected.id} />}
      </ShopDetailAside>
    </div>
  );
}
