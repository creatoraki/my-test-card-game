// 右侧定宽详情栏 —— 与据点卡牌商店 CardShopDetail 同一范式:
// 上半是「这次交易到底换到什么」, 栏底固定一条提示 + **唯一的**购买按钮。

import { getItemDef } from "@/data";
import type { TradeServiceDef } from "@/data/tradeServices";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import TradeGoodsDetail from "./TradeGoodsDetail";
import s from "./TradeDetail.module.css";

const KIND_LABEL: Record<string, string> = {
  goods: "货物交易",
  random: "随机团队增益",
  party: "队伍服务",
  pending: "待办结算服务",
};

interface Props {
  service: TradeServiceDef;
  sold: boolean;
  stack: ItemStack | null;
  owned: number;
  canBuy: boolean;
  reason?: string;
  message: string;
  onBuy: () => void;
}

export default function TradeDetail({
  service,
  sold,
  stack,
  owned,
  canBuy,
  reason,
  message,
  onBuy,
}: Props) {
  const currency = getItemDef(service.currencyItemId);
  const short = owned < service.price;
  const hint = message || reason || "食品仅在确认交易时扣除，跳过不会退款。";

  return (
    <aside className={s.detail} aria-label="交易详情">
      <div className={s.scroll}>
        {service.kind === "goods" ? (
          stack ? (
            <TradeGoodsDetail stack={stack} />
          ) : (
            <p className={s.idle}>选择左侧公开货位查看物品详情。</p>
          )
        ) : (
          <ServiceSummary service={service} />
        )}
      </div>

      <div className={s.foot}>
        <p className={s.hint} data-tone={message ? "ok" : reason ? "warn" : undefined} aria-live="polite">
          {hint}
        </p>
        <button
          className={cx(s.buy, short && !sold && s.short)}
          type="button"
          data-sfx="confirm"
          disabled={sold || !canBuy}
          onClick={onBuy}
          aria-label={sold ? "该服务已成交" : `确认支付 ${currency.name} ×${service.price}`}
        >
          {sold ? (
            <span className={s.buyLabel}>已成交</span>
          ) : (
            <>
              <ItemIconFrame
                itemId={service.currencyItemId}
                size="sm"
                tone={short ? "short" : "rarity"}
                className={s.buyIcon}
              />
              {/* ★ 文字在框外 */}
              <span className={s.buyLabel}>确认支付</span>
              <span className={s.buyCost}>{currency.name} ×{service.price}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function ServiceSummary({ service }: { service: TradeServiceDef }) {
  return (
    <div className={s.summary}>
      <span className={s.kicker}>{KIND_LABEL[service.kind] ?? "交易服务"}</span>
      <h4 className={s.name}>{service.name}</h4>
      <p className={s.desc}>{service.desc}</p>
      <p className={s.note}>
        {service.kind === "random"
          ? "成交后按左侧概率随机获得 1 个祝福遗物，本次抵达不可重来。"
          : service.kind === "pending"
            ? "成交后进入待办清单，回到节点继续处理指定角色。"
            : "成交后立即对全队生效。"}
      </p>
    </div>
  );
}
