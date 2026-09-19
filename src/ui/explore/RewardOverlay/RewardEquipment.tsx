import { useEffect, useState } from "react";
import { getCharacter, getItemDef } from "@/data";
import { EQUIP_SLOTS } from "@/store/townStore";
import { SLOT_LABEL, type EquipSlot, type ItemStack } from "@/items/types";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import { EventPanelStage, EventPanelBody, EventPanelFoot, EventPanelButton, EventPanelNotice } from "@/ui/common/EventPanel";
import s from "@/ui/explore/styles/rewardKit.module.css";
export function EquipOffers({
  offers,
  onPick,
  onSkip,
}: {
  offers: ItemStack[];
  onPick: (index: number) => void;
  onSkip: () => void;
}) {
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);

  useEffect(() => {
    if (hovered && !offers.some((stack) => stack.uid === hovered.uid)) {
      setHovered(null);
    }
  }, [hovered, offers]);

  const hoveredStack = hovered
    ? offers.find((stack) => stack.uid === hovered.uid) ?? null
    : null;

  return (
    <EventPanelStage>
      <EventPanelBody caption="候选属性已在事件结算时确定，选择一件放入拾取框。">
        {offers.length ? (
          <div className={s["item-list"]}>
            {offers.map((stack, index) => (
              <div
                className={s["item-choice"]}
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
                <ItemSlot stack={stack} showName={false} onClick={() => onPick(index)} />
              </div>
            ))}
          </div>
        ) : (
          <EventPanelNotice>当前没有可用装备候选。</EventPanelNotice>
        )}
      </EventPanelBody>
      {hoveredStack && hovered && (
        <ItemTooltip
          stack={hoveredStack}
          point={hovered.point}
          themeStyle={inventoryThemeVars(EXPLORE_BACKPACK_COLORS)}
        />
      )}
      <EventPanelFoot note="未选择的候选不会进入背包">
        <EventPanelButton onClick={onSkip}>放弃候选</EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}

export function ReforgePicker({
  backpack,
  characters,
  bias,
  onBackpack,
  onEquipped,
  onSkip,
}: {
  backpack: ItemStack[];
  characters: { charId: string; character: { equipped: Record<EquipSlot, ItemStack | null> } }[];
  bias?: "offense" | "defense";
  onBackpack: (uid: string) => void;
  onEquipped: (charId: string, slot: EquipSlot) => void;
  onSkip: () => void;
}) {
  const backpackEquipment = backpack.filter((stack) => getItemDef(stack.itemId).category === "equipment");
  const equipped = characters.flatMap(({ charId, character }) =>
    EQUIP_SLOTS.flatMap((slot) => {
      const stack = character.equipped?.[slot];
      return stack ? [{ charId, slot, stack }] : [];
    }),
  );
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);

  useEffect(() => {
    const available = [...backpackEquipment, ...equipped.map((entry) => entry.stack)];
    if (hovered && !available.some((stack) => stack.uid === hovered.uid)) {
      setHovered(null);
    }
  }, [backpackEquipment, equipped, hovered]);

  const hoveredStack = hovered
    ? [...backpackEquipment, ...equipped.map((entry) => entry.stack)].find((stack) => stack.uid === hovered.uid) ?? null
    : null;

  return (
    <EventPanelStage>
      <EventPanelBody
        caption={`选择一件装备重铸羁绊${bias ? `，当前偏向${bias === "offense" ? "攻击" : "防御"}` : ""}。`}
      >
        {backpackEquipment.length || equipped.length ? (
          <div className={s["reforge-groups"]}>
            <div>
              <span className={s["group-label"]}>探索背包</span>
              <div className={s["item-list"]}>
                {backpackEquipment.map((stack) => (
                  <div
                    className={s["item-choice"]}
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
                    <ItemSlot stack={stack} showName={false} onClick={() => onBackpack(stack.uid)} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className={s["group-label"]}>角色装备</span>
              <div className={s["item-list"]}>
                {equipped.map(({ charId, slot, stack }) => (
                  <div
                    className={s["equipped-choice"]}
                    key={`${charId}-${slot}`}
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
                    <ItemSlot stack={stack} showName={false} onClick={() => onEquipped(charId, slot)} />
                    <span>{getCharacter(charId).name} · {SLOT_LABEL[slot]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EventPanelNotice>没有可重铸的装备。</EventPanelNotice>
        )}
      </EventPanelBody>
      {hoveredStack && hovered && (
        <ItemTooltip
          stack={hoveredStack}
          point={hovered.point}
          themeStyle={inventoryThemeVars(EXPLORE_BACKPACK_COLORS)}
        />
      )}
      <EventPanelFoot
        note={backpackEquipment.length || equipped.length ? "未选择的装备保持原样" : "本次羁绊重铸无法执行"}
      >
        <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}

