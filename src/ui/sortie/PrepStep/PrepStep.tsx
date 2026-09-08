import { useCallback } from "react";
import { RULES } from "@/engine";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { StockShelf } from "@/ui/sortie/StockShelf";
import { StorageInventory } from "@/ui/sortie/StorageInventory";
import { VendorBot, useVendorChatter } from "@/ui/sortie/VendorBot";
import { cx } from "@/ui/common/cx";
import s from "./PrepStep.module.css";
import { SORTIE_BACKPACK_COLORS } from "../styles/inventoryPalettes";

interface Props {
  active: boolean;
  entering: boolean;
  exiting: boolean;
}

export function PrepStep({ active, entering, exiting }: Props) {
  const loot = useTownStore((state) => state.loot);
  const backpack = useSortieStore((state) => state.backpack);
  const putBack = useSortieStore((state) => state.putBack);
  const credits = useCountUp(loot, 120, 460);
  // 页面上所有的软反馈(买到了/买不起/装不下/退了钱)都由机器人说出来, 这里只负责触发。
  const { line, say } = useVendorChatter(active);

  const sayBought = useCallback(() => say("buy"), [say]);
  const sayPoor = useCallback(() => say("poor"), [say]);
  const sayFull = useCallback(() => say("full"), [say]);
  const sayTaken = useCallback(() => say("takeStorage"), [say]);

  // 退回来源的规则真相点在 sortieStore.refundStack; 这里只**读**购买账本决定说哪一句 ——
  // 这堆里只要有一件是本次买的就会退钱, 否则纯粹是把仓库的东西送回去。
  const handlePutBack = useCallback(
    (uid: string, itemId: string) => {
      const refunded = (useSortieStore.getState().bought[itemId] ?? 0) > 0;
      putBack(uid);
      say(refunded ? "refund" : "storeBack");
    },
    [putBack, say],
  );

  return (
    <section className={s.step} data-active={active} aria-hidden={!active}>
      <div className={cx(s.credits, entering && s.slideInRight, exiting && s.slideOutRight)}>
        <span className={s.creditsLabel}>终端积分</span>
        <strong className={s.creditsValue}>{credits.toLocaleString()}</strong>
      </div>

      <div className={cx(s.left, entering && s.slideInLeft, exiting && s.slideOutLeft)}>
        <StorageInventory className={s.areaStorage} onTaken={sayTaken} onFull={sayFull} />
        <StockShelf
          active={active}
          entering={entering}
          className={s.areaShelf}
          onBought={sayBought}
          onPoor={sayPoor}
          onFull={sayFull}
        />
      </div>

      <div className={cx(s.right, entering && s.slideInRight, exiting && s.slideOutRight)}>
        <ItemInventoryPanel
          className={s.areaBackpack}
          stacks={backpack}
          rows={4}
          columns={6}
          capacity={RULES.burden.backpackSlots}
          title="背包"
          subtitle="点击退回来源"
          colorMap={SORTIE_BACKPACK_COLORS}
          onSelect={(stack) => {
            if (stack) handlePutBack(stack.uid, stack.itemId);
          }}
        />
      </div>

      {/* 机器人所在的这一格由本页定位, 组件自己只管立绘与气泡的相对关系 ——
          面板类与组件根类同层级会互相盖(谁后进样式表谁赢), 故用外层容器隔开。 */}
      <div className={cx(s.areaVendor, entering && s.slideInRight, exiting && s.slideOutRight)}>
        <VendorBot line={line} />
      </div>
    </section>
  );
}
