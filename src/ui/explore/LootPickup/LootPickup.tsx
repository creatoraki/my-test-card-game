import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./LootPickup.module.css";

interface FlyingLoot {
  id: number;
  stack: ItemStack;
  from: { left: number; top: number };
  to: { left: number; top: number };
}

function LootPickup() {
  const pendingLoot = useExploreStore((state) => state.session?.pendingLoot ?? []);
  const takeLoot = useExploreStore((state) => state.takeLoot);
  const takeAllLoot = useExploreStore((state) => state.takeAllLoot);
  const abandonLoot = useExploreStore((state) => state.abandonLoot);
  const [confirming, setConfirming] = useState(false);
  const [flying, setFlying] = useState<FlyingLoot | null>(null);

  if (!pendingLoot.length) return null;

  const displayed = pendingLoot;

  const pick = (stack: (typeof displayed)[number]) => {
    if (flying) return;
    const source = document.querySelector<HTMLElement>(`[data-loot-uid="${stack.uid}"]`);
    const target = document.getElementById("explore-backpack-bar");
    if (!source || !target) {
      takeLoot(pendingLoot.findIndex((item) => item.uid === stack.uid));
      return;
    }

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const id = Date.now();
    setFlying({
      id,
      stack,
      from: { left: sourceRect.left, top: sourceRect.top },
      to: {
        left: targetRect.left + targetRect.width / 2 - sourceRect.width / 2,
        top: targetRect.top + targetRect.height / 2 - sourceRect.height / 2,
      },
    });
    window.setTimeout(() => {
      takeLoot(pendingLoot.findIndex((item) => item.uid === stack.uid));
      setFlying((current) => (current?.id === id ? null : current));
    }, 430);
  };

  return (
    <div className={s["loot-layer"]}>
      <section className={s["loot-panel"]} aria-label="待拾取物品">
        <span className={s["panel-frame"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <header className={s["loot-head"]}>
          <div>
            <span className={s["loot-kicker"]}>EVENT MATERIAL RECOVERY</span>
            <h3 className={s["loot-title"]}>发现物品</h3>
          </div>
          <span className={s["loot-count"]}>{pendingLoot.length} 件待拾取</span>
        </header>
        <div className={s["loot-body"]}>
          <p className={s["loot-desc"]}>点击物品将它们收入背包。放弃的物品不会进入本次远征记录。</p>
          <div className={s["loot-grid"]}>
            {displayed.map((stack) => (
              <div className={s["loot-item"]} data-loot-uid={stack.uid} key={stack.uid}>
                <ItemSlot stack={stack} onClick={() => pick(stack)} />
              </div>
            ))}
          </div>
        </div>
        <footer className={s["loot-foot"]}>
          {confirming ? (
            <div className={s["loot-confirm"]}>
              <span>放弃剩余物品？</span>
              <button className={cx(s["loot-btn"], s["is-danger"])} type="button" onClick={abandonLoot}>
                确认放弃
              </button>
              <button className={s["loot-btn"]} type="button" onClick={() => setConfirming(false)}>
                返回
              </button>
            </div>
          ) : (
            <>
              <button className={cx(s["loot-btn"], s["is-primary"])} type="button" onClick={takeAllLoot}>
                全部拾取
              </button>
              <button className={s["loot-btn"]} type="button" onClick={() => setConfirming(true)}>
                放弃剩余
              </button>
            </>
          )}
        </footer>
      </section>
      {flying && typeof document !== "undefined" &&
        createPortal(
          <div
            className={s["loot-fly"]}
            style={
              {
                "--fly-left": `${flying.from.left}px`,
                "--fly-top": `${flying.from.top}px`,
                "--fly-x": `${flying.to.left - flying.from.left}px`,
                "--fly-y": `${flying.to.top - flying.from.top}px`,
              } as CSSProperties
            }
          >
            <ItemSlot stack={flying.stack} />
          </div>,
          document.body,
        )}
    </div>
  );
}

export default LootPickup;
