import { useState, type CSSProperties } from "react";
import { getCharacter } from "@/data";
import { HandCard } from "@/ui/battle/HandCard";
import { CardKeywordNotes } from "@/ui/common/CardKeywordNotes";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { CARD_GROUPS, CARD_CATALOG, CARD_RARITY_LABEL, cardFor } from "../codexCatalog";
import { MuseumLockedTile } from "../MuseumLockedTile";
import s from "./MuseumCardHall.module.css";

const CARD_STYLE = { "--hand-card-w": "154px", "--hc-text-h": "72px", "--hand-card-h": "226px" } as CSSProperties;
const DETAIL_CARD_STYLE = { "--hand-card-w": "248px", "--hc-text-h": "96px", "--hand-card-h": "344px" } as CSSProperties;

export function MuseumCardHall() {
  const recorded = useTownStore((state) => state.codex.cards);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedDef = selectedId ? CARD_CATALOG.find((card) => card.id === selectedId) : undefined;
  const selected = selectedDef && recorded.includes(selectedDef.id) ? cardFor(selectedDef.id) : null;

  return (
    <div className={s["hall"]}>
      <section className={s["catalog"]}>
        <div className={s["section-head"]}>
          <div><span className={s["kicker"]}>构筑档案</span><h3>卡牌名录</h3></div>
          <span className={s["count"]}>{recorded.length} / {CARD_CATALOG.length}</span>
        </div>
        <div className={s["card-groups"]}>
          {CARD_GROUPS.map((group) => (
            <section key={group.id} className={s["card-group"]}>
              <h4 style={{ "--owner-color": group.color } as CSSProperties}><span>{group.name}</span><small>{group.cards.filter((card) => recorded.includes(card.id)).length}/{group.cards.length}</small></h4>
              <div className={s["card-grid"]}>
                {group.cards.map((def, index) => {
                  const isRecorded = recorded.includes(def.id);
                  return isRecorded ? (
                    <button
                      key={def.id}
                      type="button"
                      className={cx(s["card-button"], selectedId === def.id && s["is-selected"])}
                      style={{ "--i": index } as CSSProperties}
                      aria-label={`查看${def.name}详情`}
                      onClick={() => setSelectedId(def.id)}
                    >
                      <span data-deck-card style={CARD_STYLE}>
                        <HandCard card={cardFor(def.id)} variant="pile" playable selected={false} />
                      </span>
                    </button>
                  ) : (
                    <button
                      key={def.id}
                      type="button"
                      className={s["locked-card"]}
                      aria-label={`未收录卡牌：${def.name}`}
                      onClick={() => setSelectedId(def.id)}
                    >
                      <MuseumLockedTile />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
      <aside className={s["detail"]}>
        {selected ? (
          <div className={s["card-detail"]}>
            <div className={s["detail-card"]} data-deck-card style={DETAIL_CARD_STYLE}>
              <HandCard card={selected} variant="pile" playable selected={false} />
            </div>
            <div className={s["detail-copy"]}>
              <span className={s["kicker"]}>已收录卡牌</span>
              <h4>{selected.name}</h4>
              <p>{getCharacter(selected.ownerCharId).name} · {selected.cost} 点法力 · {CARD_RARITY_LABEL[selected.rarity ?? "common"] ?? "普通"}</p>
              <p className={s["card-text"]}>{selected.text}</p>
              <CardKeywordNotes text={selected.text} />
            </div>
          </div>
        ) : (
          <p className={s["empty"]}>选择已收录卡牌查看详情</p>
        )}
      </aside>
    </div>
  );
}
