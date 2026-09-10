// 货架上的一个货位 = 上方的商品(只看不点) + 下方的价格牌(唯一的购买入口)。
//
// ★ 为什么把「看」和「买」拆成两个元素: 悬浮商品要弹详情浮卡, 点击要扣钱 —— 合成一个按钮
//   就会出现「我只是想看看说明, 结果买了三瓶牛奶」。价格牌是明确的、可 Tab 的付款动作。
//
// ★ 悬浮的**视觉**全部交给 CSS :hover(同据点物品货位的取舍): 走一圈 React state 再回来
//   打类名要等 render+commit, 而 :hover 是同帧的。父级只拿悬浮事件去定位浮卡。

import { memo, useCallback } from "react";
import { getItemDef } from "@/data";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import s from "./StockSlot.module.css";

interface Props {
  itemId: string;
  /** 积分够不够。不够时价格牌置灰, 但商品本身照常可悬浮查看。 */
  affordable: boolean;
  onBuy: (itemId: string) => void;
  /** el 为 null = 指针移出/失焦。父级据此开关浮卡。 */
  onHover: (itemId: string, el: HTMLElement | null) => void;
}

function StockSlot({ itemId, affordable, onBuy, onHover }: Props) {
  const def = getItemDef(itemId);
  const price = def.buyValue ?? 0;

  const enter = useCallback(
    (event: { currentTarget: HTMLElement }) => onHover(itemId, event.currentTarget),
    [itemId, onHover],
  );
  const leave = useCallback(() => onHover(itemId, null), [itemId, onHover]);
  const buy = useCallback(() => onBuy(itemId), [itemId, onBuy]);

  return (
    <div className={s.slot}>
      <div
        className={s.goods}
        tabIndex={0}
        role="img"
        aria-label={`${def.name}，售价 ${price} 积分`}
        onPointerEnter={enter}
        onPointerLeave={leave}
        onFocus={enter}
        onBlur={leave}
      >
        <span className={s.art}>{itemIcon(def)}</span>
        <span className={s.name}>{def.name}</span>
      </div>
      <button
        className={cx(s.price, affordable ? s.priceReady : s.pricePoor)}
        type="button"
        data-sfx="confirm"
        onClick={buy}
        aria-label={`买入${def.name}，${price} 积分`}
      >
        <strong className={s.priceValue}>{price}</strong>
        <span className={s.priceUnit}>积分</span>
      </button>
    </div>
  );
}

export default memo(StockSlot);
