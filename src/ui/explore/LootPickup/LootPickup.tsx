import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import { useRevealPresence } from "@/ui/common/ModalReveal";
import {
  EventPanelBody,
  EventPanelButton,
  EventPanelFoot,
  EventPanelFrame,
  EventPanelStage,
} from "@/ui/common/EventPanel";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { useLootModuleActions } from "@/ui/common/item/ModuleInstall";
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

  const pick = (stack: ItemStack) => {
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

  // 模组不走「点一下就拾取」: 格子上直接给出「装载 / 拾取」两个悬浮按钮(见 ModuleInstall)。
  const moduleActions = useLootModuleActions({ onTake: pick });

  if (!presence.mounted || !displayed.length) return null;

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
        <span className={s["panel-scan"]} aria-hidden />
        <EventPanelFrame
          accent="#9be4bd"
          kicker="事件掉落 / 回收"
          title="发现物品"
          status={<span className={s["loot-count"]}>{pendingLoot.length} 件</span>}
          contentKey={`loot-${displayed.length}`}
        >
          <EventPanelStage>
            <EventPanelBody
              caption={
                lootMessage ??
                "点击拾取，未拾取的物品会丢失；模组可以选择直接装载。"
              }
            >
              <div className={s["loot-grid"]}>
                {displayed.map((stack) => (
                  <div
                    className={s["loot-item"]}
                    data-loot-uid={stack.uid}
                    data-sfx="pickup"
                    key={stack.uid}
                    onPointerEnter={(event) =>
                      setHovered({
                        uid: stack.uid,
                        point: tooltipPointFromElement(event.currentTarget),
                      })
                    }
                    onPointerLeave={() =>
                      setHovered((current) => (current?.uid === stack.uid ? null : current))
                    }
                  >
                    <ItemSlot
                      stack={stack}
                      showName={false}
                      onClick={() => {
                        if (!moduleActions.handleClick(stack)) pick(stack);
                      }}
                    />
                    {moduleActions.renderActions(stack)}
                  </div>
                ))}
              </div>
            </EventPanelBody>
            {hoveredStack && hovered && (
              <ItemTooltip
                stack={hoveredStack}
                point={hovered.point}
                themeStyle={inventoryThemeVars(EXPLORE_BACKPACK_COLORS)}
              />
            )}
            {confirming ? (
              <EventPanelFoot note="放弃剩余？未拾取的物品会永久丢失">
                <EventPanelButton tone="danger" onClick={abandonLoot}>
                  确认放弃
                </EventPanelButton>
                <EventPanelButton onClick={() => setConfirming(false)}>返回</EventPanelButton>
              </EventPanelFoot>
            ) : (
              <EventPanelFoot note={`待拾取 ${pendingLoot.length} 件`}>
                <EventPanelButton tone="primary" onClick={takeAllLoot} data-sfx="pickupAll">
                  全部拾取
                </EventPanelButton>
                <EventPanelButton onClick={() => setConfirming(true)}>放弃剩余</EventPanelButton>
              </EventPanelFoot>
            )}
          </EventPanelStage>
        </EventPanelFrame>
      </section>
      {moduleActions.overlay}
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
