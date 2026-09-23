import { useEffect, useState } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import { useRevealPresence } from "@/ui/common/frame/ModalReveal";
import {
  EventPanelBody,
  EventPanelButton,
  EventPanelFoot,
  EventPanelFrame,
  EventPanelStage,
} from "@/ui/common/widget/EventPanel";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { useLootModuleActions } from "@/ui/common/item/ModuleInstall";
import { inventoryThemeVars } from "@/ui/common/item/shared/inventoryTheme";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import { panelRevealCloseMs, panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { cx } from "@/ui/common/shared/cx";
import { useLootPick } from "./useLootPick";
import s from "./LootPickup.module.css";

interface LootPickupProps {
  gate: boolean;
}

/** 独立拾取浮层: 事件面板之外来源的掉落(事件面板内的掉落由 DossierLoot 在面板里直接处理)。 */
function LootPickup({ gate }: LootPickupProps) {
  const pendingLoot = useExploreStore((state) => state.session?.pendingLoot ?? []);
  const takeAllLoot = useExploreStore((state) => state.takeAllLoot);
  const abandonLoot = useExploreStore((state) => state.abandonLoot);
  const [confirming, setConfirming] = useState(false);
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);
  const loot = useLootPick();
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

  const pick = (stack: ItemStack) => { loot.pick(stack); };

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
                loot.message ??
                "点击拾取，未拾取的物品会丢失；模组可以选择直接装载。"
              }
            >
              <div className={s["loot-grid"]}>
                {displayed.map((stack) => (
                  <div
                    className={s["loot-item"]}
                    data-loot-uid={stack.uid}
                    data-guide-anchor={
                      moduleActions.isModule(stack)
                        ? "loot-module"
                        : getItemDef(stack.itemId).category === "equipment"
                          ? "loot-equipment"
                          : undefined
                    }
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
      {loot.flyingPortal}
    </div>
  );
}

export default LootPickup;
