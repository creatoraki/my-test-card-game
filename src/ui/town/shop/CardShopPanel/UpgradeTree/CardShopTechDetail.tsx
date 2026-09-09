import {
  CARD_SHOP_MAX_LEVEL,
  CARD_SHOP_TECHS,
  cardShopRefreshBase,
  cardShopSlots,
  cardShopTechState,
  cardShopLevelOf,
  techCostCheck,
  type CardShopTechState,
} from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import { ShelfPlusGlyph, SupplyLoopGlyph } from "./techIcons";
import s from "./CardShopTechDetail.module.css";

interface Props {
  selectedId: string | null;
  doneTechs: string[];
  loot: number;
  storage: ItemStack[];
  onResearch: (techId: string) => void;
}

const STATE_TEXT: Record<CardShopTechState, string> = {
  done: "已研究，效果已生效",
  available: "前置已完成，可以研究",
  lacking: "前置已完成，但材料或积分不足",
  locked: "需要先完成前置节点",
};

export function CardShopTechDetail({ selectedId, doneTechs, loot, storage, onResearch }: Props) {
  const tech = CARD_SHOP_TECHS.find((entry) => entry.id === selectedId);
  const level = cardShopLevelOf(doneTechs);

  if (!tech) {
    return (
      <aside className={s.detail} aria-label="卡牌商店当前概览">
        <span className={s.kicker}>当前概览</span>
        <h3>卡牌展柜状态</h3>
        <div className={s.overviewGrid}>
          <OverviewItem label="科技等级" value={`Lv.${level}`} />
          <OverviewItem label="货位" value={`${cardShopSlots(doneTechs)} / 8`} />
          <OverviewItem label="刷新基价" value={`${cardShopRefreshBase(doneTechs)} 积分`} />
          <OverviewItem label="最高等级" value={`Lv.${CARD_SHOP_MAX_LEVEL}`} />
        </div>
        <p className={s.empty}>
          {level >= CARD_SHOP_MAX_LEVEL
            ? "卡牌商店已达最高等级，全部科技节点均已研究。"
            : "点击左侧节点查看升级效果与消耗。"}
        </p>
      </aside>
    );
  }

  const state = cardShopTechState(tech, doneTechs, loot, storage);
  const check = techCostCheck(tech, loot, storage);
  const branch = tech.kind === "slot" ? "展柜扩容" : "补货链路";
  const Glyph = tech.kind === "slot" ? ShelfPlusGlyph : SupplyLoopGlyph;

  return (
    <aside className={s.detail} aria-label={`${tech.name}详情`}>
      <span className={s.kicker}>{branch}</span>
      <div className={s.techTitle}>
        <div className={s.techIcon} aria-hidden>
          <svg viewBox="0 0 48 48" role="presentation">
            <Glyph />
          </svg>
        </div>
        <h3>{tech.name}</h3>
      </div>
      <p className={s.desc}>{tech.desc}</p>

      <div className={s.section}>
        <span className={s.sectionTitle}>解锁消耗</span>
        <div className={cx(s.costRow, !check.lootOk && state !== "done" && s["is-lacking"])}>
          <span>居民积分</span>
          <strong>{tech.loot}</strong>
        </div>
        <div className={s.materials}>
          {check.materials.map((material) => {
            const stack: ItemStack = {
              uid: `card-shop-detail-${material.itemId}`,
              itemId: material.itemId,
              count: Math.max(material.have, 1),
            };
            const lacking = !material.ok && state !== "done";
            return (
              <div key={material.itemId} className={cx(s.material, lacking && s["is-lacking"])}>
                <ItemSlot stack={stack} showName={false} disabled={!material.have} className={s.materialSlot} />
                <span>×{material.need}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={s.status} data-state={state}>
        <span className={s.sectionTitle}>节点状态</span>
        <span>{STATE_TEXT[state]}</span>
      </div>
      <button className={s.research} type="button" disabled={state !== "available"} onClick={() => onResearch(tech.id)}>
        {state === "done" ? "已研究" : "研究"}
      </button>
    </aside>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.overviewItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
