import {
  SHOP_MAX_LEVEL,
  SHOP_TECHS,
  shopRefreshBase,
  shopSlotCount,
  shopTechState,
  shopLevelOf,
  shopTechCost,
  type ShopTechState,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { ShopTechCost } from "./ShopTechCost";
import { ShelfPlusGlyph, SupplyLoopGlyph } from "./techIcons";
import s from "./ShopTechDetail.module.css";

interface Props {
  selectedId: string | null;
  doneTechs: string[];
  storage: ItemStack[];
  onResearch: (techId: string) => void;
}

const STATE_TEXT: Record<ShopTechState, string> = {
  done: "已研究，效果已生效",
  available: "前置已完成，可以研究",
  lacking: "前置已完成，但材料不足",
  locked: "需要先完成前置节点",
};

export function ShopTechDetail({ selectedId, doneTechs, storage, onResearch }: Props) {
  const tech = SHOP_TECHS.find((entry) => entry.id === selectedId);
  const level = shopLevelOf(doneTechs);

  if (!tech) {
    return (
      <aside className={s.detail} aria-label="商店当前概览">
        <span className={s.kicker}>当前概览</span>
        <h3>商店货架状态</h3>
        <div className={s.overviewGrid}>
          <OverviewItem label="科技等级" value={`等级 ${level}`} />
          <OverviewItem label="货位" value={`${shopSlotCount(doneTechs)} / 8`} />
          <OverviewItem label="刷新基价" value={`${shopRefreshBase(doneTechs)} 积分`} />
          <OverviewItem label="最高等级" value={`等级 ${SHOP_MAX_LEVEL}`} />
        </div>
        <p className={s.empty}>
          {level >= SHOP_MAX_LEVEL
            ? "商店已达最高等级，全部科技节点均已研究。"
            : "点击左侧节点查看升级效果与消耗。"}
        </p>
      </aside>
    );
  }

  const state = shopTechState(tech, doneTechs, storage);
  const cost = shopTechCost(tech, storage);
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
        <span className={s.sectionTitle}>升级材料</span>
        <ShopTechCost materials={cost.materials} done={state === "done"} />
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
