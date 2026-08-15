import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import { useRevealPresence } from "@/ui/common/ModalReveal";
import ItemTooltip, {
  tooltipPointFromRect,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import { panelRevealCloseMs, panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { cx } from "@/ui/common/cx";
import s from "./LootPickup.module.css";

interface FlyingLoot {
  id: number;
  stack: ItemStack;
  from: { left: number; top: number; width: number };
  to: { left: number; top: number };
}

interface LootPickupProps {
  gate: boolean;
}

function LootPickup({ gate }: LootPickupProps) {
  const pendingLoot = useExploreStore((state) => state.session?.pendingLoot ?? []);
  const takeLoot = useExploreStore((state) => state.takeLoot);
  const takeAllLoot = useExploreStore((state) => state.takeAllLoot);
  const abandonLoot = useExploreStore((state) => state.abandonLoot);
  const [confirming, setConfirming] = useState(false);
  const [flying, setFlying] = useState<FlyingLoot | null>(null);
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);
  const [lootMessage, setLootMessage] = useState<string | null>(null);
  const presence = useRevealPresence(
    gate && pendingLoot.length > 0,
    pendingLoot,
    panelRevealCloseMs(),
  );
  const displayed = presence.data;

  useEffect(() => {
    if (hovered && !displayed.some((stack) => stack.uid === hovered.uid)) {
      setHovered(null);
    }
  }, [displayed, hovered]);

  if (!presence.mounted || !displayed.length) return null;

  const pick = (stack: (typeof displayed)[number]) => {
    if (flying) return;
    const index = pendingLoot.findIndex((item) => item.uid === stack.uid);
    if (index < 0) return;
    const source = document.querySelector<HTMLElement>(`[data-loot-uid="${stack.uid}"]`);
    const target = document.getElementById("explore-backpack-bar");
    const sourceRect = source?.getBoundingClientRect();
    const targetRect = target?.getBoundingClientRect();
    const accepted = takeLoot(index);
    if (!accepted) {
      setLootMessage("背包已满");
      return;
    }
    setLootMessage(null);
    if (!sourceRect || !targetRect) {
      return;
    }

    const id = Date.now();
    setFlying({
      id,
      stack,
      from: { left: sourceRect.left, top: sourceRect.top, width: sourceRect.width },
      to: {
        left: targetRect.left + targetRect.width / 2 - sourceRect.width / 2,
        top: targetRect.top + targetRect.height / 2 - sourceRect.height / 2,
      },
    });
    window.setTimeout(() => {
      setFlying((current) => (current?.id === id ? null : current));
    }, 430);
  };

  const hoveredStack = hovered
    ? pendingLoot.find((stack) => stack.uid === hovered.uid) ?? null
    : null;

  return (
    <div className={s["loot-layer"]} data-closing={presence.closing || undefined}>
      <section
        className={cx(s["loot-panel"], s["panel-reveal"])}
        data-closing={presence.closing || undefined}
        style={panelRevealVars()}
        aria-label="待拾取物品"
      >
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-frame"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <header className={s["loot-head"]}>
          <div>
            <h3 className={s["loot-title"]}>发现物品</h3>
          </div>
          <span className={s["loot-count"]}>{pendingLoot.length} 件</span>
        </header>
        <div className={s["loot-body"]}>
          <p className={s["loot-desc"]}>
            {lootMessage ?? "点击拾取，未拾取的物品会丢失"}
          </p>
          <div className={s["loot-grid"]}>
            {displayed.map((stack) => (
              <div
                className={s["loot-item"]}
                data-loot-uid={stack.uid}
                key={stack.uid}
                onPointerEnter={(event) =>
                  setHovered({
                    uid: stack.uid,
                    point: tooltipPointFromRect(event.currentTarget.getBoundingClientRect()),
                  })
                }
                onPointerLeave={() =>
                  setHovered((current) => (current?.uid === stack.uid ? null : current))
                }
              >
                <ItemSlot stack={stack} showName={false} onClick={() => pick(stack)} />
              </div>
            ))}
          </div>
        </div>
        {hoveredStack && hovered && (
          <ItemTooltip
            stack={hoveredStack}
            point={hovered.point}
            themeStyle={inventoryThemeVars(EXPLORE_BACKPACK_COLORS)}
          />
        )}
        <footer className={s["loot-foot"]}>
          {confirming ? (
            <div className={s["loot-confirm"]}>
              <span>放弃剩余？</span>
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
                "--fly-w": `${flying.from.width}px`,
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
