// 左内容区 —— 按服务类型分三态: 商品货位网格 / 团队 BUFF 概率表 / 服务说明卡。
//
// ★ 货位格里, 1:1 边框**只**包住图标, 物品名排在框的正下方(框外)。

import type { TradeServiceDef } from "@/data/tradeServices";
import { getItemDef } from "@/data";
import type { TradeSlotState } from "@/explore/types";
import { cx } from "@/ui/common/cx";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import s from "./ServiceStage.module.css";

interface Props {
  service: TradeServiceDef;
  slot: TradeSlotState;
  selectedStockIndex?: number;
  onSelect: (stockIndex: number) => void;
}

export default function ServiceStage({ service, slot, selectedStockIndex, onSelect }: Props) {
  return (
    <section className={s.stage} aria-label={service.name}>
      <p className={s.notice}>
        <strong>{service.name}</strong>
        <span>{service.desc}</span>
      </p>

      {service.kind === "goods" ? (
        <GoodsShelf slot={slot} selectedStockIndex={selectedStockIndex} onSelect={onSelect} />
      ) : service.kind === "random" ? (
        <BuffTable slot={slot} />
      ) : (
        <ServiceBrief service={service} />
      )}
    </section>
  );
}

function GoodsShelf({
  slot,
  selectedStockIndex,
  onSelect,
}: {
  slot: TradeSlotState;
  selectedStockIndex?: number;
  onSelect: (stockIndex: number) => void;
}) {
  if (!slot.stock.length) return <p className={s.empty}>本地区暂无可用货位。</p>;

  return (
    <div className={s.shelf} aria-label="公开货位">
      {slot.stock.map((stock, stockIndex) => {
        const def = getItemDef(stock.itemId);
        const selected = selectedStockIndex === stockIndex;
        return (
          <div className={s.cell} key={stock.uid}>
            <ItemIconFrame
              as="button"
              itemId={stock.itemId}
              size="xl"
              selected={selected}
              dimmed={slot.sold}
              disabled={slot.sold}
              aria-label={`选择 ${def.name}`}
              onClick={() => onSelect(stockIndex)}
            />
            {/* ★ 名称在框外 */}
            <span className={cx(s.cellName, selected && s.cellNameOn)}>{def.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function BuffTable({ slot }: { slot: TradeSlotState }) {
  const options = slot.buffOptions ?? [];
  if (!options.length) return <p className={s.empty}>本次没有可用的团队 BUFF 候选。</p>;

  return (
    <ul className={s.buffList} aria-label="团队 BUFF 候选">
      {options.map((option) => (
        <li className={s.buff} key={option.relicId}>
          <strong>{getItemDef(option.relicId).name}</strong>
          <span>{option.weight}%</span>
          <small>{getItemDef(option.relicId).desc}</small>
        </li>
      ))}
    </ul>
  );
}

function ServiceBrief({ service }: { service: TradeServiceDef }) {
  return (
    <div className={s.brief}>
      <span className={s.briefGlyph} aria-hidden="true">◇</span>
      <div className={s.briefCopy}>
        <strong>{service.kind === "pending" ? "待办结算服务" : "队伍服务"}</strong>
        <p>{service.desc}</p>
        <small>确认支付后立即加入远征结算流程。</small>
      </div>
    </div>
  );
}
