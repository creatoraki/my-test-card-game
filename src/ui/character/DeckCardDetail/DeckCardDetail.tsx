import type { CSSProperties } from "react";
import type { Card, Rarity, Targeting } from "@/engine";
import { getCharacter } from "@/data";
import { cardArt } from "@/ui/art/cardArt";
import { ManaCrystalIcon } from "@/ui/common/ManaCrystalIcon";
import { cx } from "@/ui/common/cx";
import s from "./DeckCardDetail.module.css";

const TARGET_LABEL: Record<Targeting, string> = {
  foe: "敌方单体",
  ally: "友方单体",
  self: "自身",
  allFoes: "全体敌人",
  allAllies: "全体友军",
  none: "无需目标",
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: "普通",
  uncommon: "优秀",
  rare: "稀有",
};

interface Props {
  card: Card | null;
  variant?: "panel" | "floating";
  className?: string;
}

export function DeckCardDetail({ card, variant = "panel", className }: Props) {
  if (!card) {
    return (
      <aside
        className={cx(s["deck-card-detail"], s["is-empty"], variant === "floating" && s["is-floating"], className)}
        aria-label="卡牌详情"
      >
        <span className={s["deck-card-detail-empty-mark"]}>DECK / READY</span>
        <p>选择一张卡牌查看完整战术信息。</p>
      </aside>
    );
  }

  const owner = getCharacter(card.ownerCharId);
  const art = cardArt(card.id);
  const rarity = card.rarity ?? "common";

  return (
    <aside
      className={cx(s["deck-card-detail"], variant === "floating" && s["is-floating"], className)}
      style={{ "--owner-color": owner.color } as CSSProperties}
      aria-label={`${card.name}卡牌详情`}
    >
      <div className={s["deck-card-detail-head"]}>
        <span className={s["deck-card-detail-kicker"]}>CARD PROFILE</span>
        <span className={s["deck-card-detail-owner"]}>{owner.name}</span>
      </div>

      <div className={s["deck-card-detail-art"]}>
        {art ? (
          <img src={art} alt={`${card.name}卡面`} draggable={false} />
        ) : (
          <span>NO VISUAL</span>
        )}
        <span className={s["deck-card-detail-cost"]}>
          <ManaCrystalIcon className={s["deck-card-detail-cost-icon"]} />
          <strong>{card.cost}</strong>
        </span>
      </div>

      <div className={s["deck-card-detail-title"]}>
        <h3>{card.name}</h3>
        <span>{card.cardType === "fast" ? "速攻 · 不推进时刻" : "普通 · 推进时刻"}</span>
      </div>

      <dl className={s["deck-card-detail-meta"]}>
        <div>
          <dt>稀有度</dt>
          <dd>{RARITY_LABEL[rarity]}</dd>
        </div>
        <div>
          <dt>施放目标</dt>
          <dd>{TARGET_LABEL[card.targeting]}</dd>
        </div>
        <div>
          <dt>状态</dt>
          <dd>{card.upgraded ? "已强化" : "基础"}</dd>
        </div>
        {card.exhaust && (
          <div>
            <dt>结算</dt>
            <dd>本场移除</dd>
          </div>
        )}
      </dl>

      <div className={s["deck-card-detail-text"]}>{card.text}</div>
    </aside>
  );
}
