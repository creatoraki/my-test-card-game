// 卡牌商店左栏: 说明条 + 角色筛选页签 + 卡架网格。

import { getCharacter } from "@/data";
import type { CardShopSlot } from "@/store/cardShopSlice";
import { cx } from "@/ui/common/cx";
import { CardShopSlotCard } from "./CardShopSlotCard";
import s from "./CardShopShelf.module.css";

interface Props {
  slots: CardShopSlot[];
  awakened: string[];
  selectedChar: string;
  selectedKey: string | null;
  onPickChar: (charId: string) => void;
  onSelect: (key: string) => void;
}

export function CardShopShelf({
  slots,
  awakened,
  selectedChar,
  selectedKey,
  onPickChar,
  onSelect,
}: Props) {
  return (
    <section className={s.shelf}>
      <div className={s.notice}>
        <strong>居民积分采购卡牌</strong>
        <span>每个货位绑定一名已唤醒角色，选中卡牌后在右侧查看详情并购买。</span>
      </div>

      <div className={s.tabs} role="tablist" aria-label="卡牌商店角色筛选">
        <button
          className={cx(s.tab, selectedChar === "all" && s["is-active"])}
          type="button"
          role="tab"
          aria-selected={selectedChar === "all"}
          onClick={() => onPickChar("all")}
        >
          全部角色
        </button>
        {awakened.map((charId) => (
          <button
            className={cx(s.tab, selectedChar === charId && s["is-active"])}
            type="button"
            role="tab"
            aria-selected={selectedChar === charId}
            key={charId}
            onClick={() => onPickChar(charId)}
          >
            {getCharacter(charId).name}
          </button>
        ))}
      </div>

      <div className={s.grid} aria-label="卡牌商店货架">
        {slots.length ? slots.map((slot, index) => (
          <CardShopSlotCard
            key={slot.key}
            slot={slot}
            index={index}
            selected={selectedKey === slot.key}
            onSelect={onSelect}
          />
        )) : <p className={s.empty}>当前筛选没有可展示的卡牌。</p>}
      </div>
    </section>
  );
}
