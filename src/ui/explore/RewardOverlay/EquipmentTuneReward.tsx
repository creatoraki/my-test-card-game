import { useState } from "react";
import { getCharacter, getItemDef } from "@/data";
import type { ExploreState, PendingAction } from "@/explore/types";
import { serviceFoodCount } from "@/explore/curio/foodPayment";
import { canTuneEquipment, tuneExploreEquipment, type ExploreEquipmentTarget } from "@/store/exploreGrowthServices";
import { EQUIP_SLOTS, useTownStore } from "@/store/townStore";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { EventPanelBody, EventPanelButton, EventPanelFoot, EventPanelNotice, EventPanelStage } from "@/ui/common/EventPanel";
import s from "./EquipmentTuneReward.module.css";

export function EquipmentTuneReward({ session, action, onFinish }: {
  session: ExploreState; action: Extract<PendingAction, { kind: "equipmentTune" }>; onFinish: () => void;
}) {
  const characters = useTownStore(state => state.characters);
  const [selected, setSelected] = useState<ExploreEquipmentTarget | null>(null);
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);
  const choices: { stack: ItemStack; target: ExploreEquipmentTarget; label: string }[] = [
    ...session.backpack.map(stack => ({ stack, target: { kind: "backpack" as const, uid: stack.uid }, label: "探索背包" })),
    ...session.party.filter(member => member.alive).flatMap(member => EQUIP_SLOTS.flatMap(slot => {
      const stack = characters[member.charId]?.equipped[slot];
      return stack ? [{ stack, target: { kind: "equipped" as const, charId: member.charId, slot, uid: stack.uid }, label: getCharacter(member.charId).name }] : [];
    })),
  ].filter(choice => canTuneEquipment(choice.stack, action.mode));
  const validSelection = choices.some(choice => choice.stack.uid === selected?.uid);
  const food = serviceFoodCount(session);
  const label = action.mode === "bond" ? "重铸羁绊" : "重置完美度";
  const result = action.result;
  const showItem = (stack: ItemStack, caption: string, target?: ExploreEquipmentTarget) => <div key={`${caption}-${stack.uid}`} className={s.choice}
    onPointerEnter={event => setHovered({ stack, point: tooltipPointFromElement(event.currentTarget) })}
    onPointerLeave={() => setHovered(null)}>
    <ItemSlot stack={stack} showName={false} selected={Boolean(target && selected?.uid === stack.uid)}
      onClick={target ? () => setSelected(target) : undefined} aria-label={`${caption}，${getItemDef(stack.itemId).name}`} />
    <span>{caption}</span><span>{getItemDef(stack.itemId).name}</span>
  </div>;
  return <EventPanelStage>
    <EventPanelBody caption={result ? `${label}已完成，可悬浮查看前后变化。`
      : `${label}消耗任意临期食品 ${action.foodCost} 份，当前持有 ${food} 份。${action.mode === "bond" ? "保留属性与完美度。" : "保留羁绊与负面代价，完美度可能提高或降低。"}`}>
      {result ? <div className={s.items}>{showItem(result.before, "重置前")}{showItem(result.after, "重置后")}</div>
        : choices.length ? <div className={s.items}>{choices.map(choice => showItem(choice.stack, choice.label, choice.target))}</div>
          : <EventPanelNotice>没有可处理的装备，本次可免费结束。</EventPanelNotice>}
    </EventPanelBody>
    {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} />}
    <EventPanelFoot note={result ? `已消耗食品 ×${action.foodCost}` : food < action.foodCost ? "食品不足，可取消，未扣款" : "选择目标后确认才扣款，只有一次机会"}>
      <EventPanelButton onClick={onFinish}>{result ? "完成" : "取消服务"}</EventPanelButton>
      {!result && <EventPanelButton tone="primary" disabled={!validSelection || food < action.foodCost}
        onClick={() => { if (selected && tuneExploreEquipment(selected)) setHovered(null); }}>确认{label}</EventPanelButton>}
    </EventPanelFoot>
  </EventPanelStage>;
}
