import { useState } from "react";
import { prepareMessengerParcel, type MessengerFoodPick } from "@/explore/curio/messenger";
import type { ItemStack } from "@/items/types";
import { MessengerPanel } from "@/ui/explore/MessengerPanel/MessengerPanel";
import { EXPLORE_RULES } from "@/explore/core/exploreRules";
import s from "./MessengerDemo.module.css";

const SAMPLE: ItemStack[] = [
  { uid: "演示牛奶", itemId: "milk", count: 3 },
  { uid: "演示面包", itemId: "bread", count: 2 },
  { uid: "演示可乐", itemId: "cola", count: 2 },
  { uid: "演示汉堡", itemId: "hamburger", count: 2 },
  { uid: "演示炸鸡", itemId: "fried-chicken", count: 1 },
  { uid: "演示披萨", itemId: "pizza", count: 1 },
];

export function MessengerDemo() {
  const [open, setOpen] = useState(false);
  const [backpack, setBackpack] = useState(SAMPLE);
  const [shipped, setShipped] = useState<ItemStack[]>([]);
  const [used, setUsed] = useState(false);
  function send(uids: string[], food: MessengerFoodPick[]) {
    if (used) return;
    const parcel = prepareMessengerParcel(backpack, uids, food);
    if (!parcel) return;
    setBackpack(parcel.backpack);
    setShipped(parcel.shipped);
    setUsed(true);
    setOpen(false);
  }
  return <>
    <div className={s.controls}>
      <button type="button" onClick={() => setOpen(true)} disabled={used}>羽翼信使 · 新版面板演示</button>
      <button type="button" onClick={() => { setBackpack(SAMPLE); setShipped([]); setUsed(false); setOpen(true); }}>重置并预览</button>
      {used && <span>已消耗 {EXPLORE_RULES.chute.foodCost} 份食品 · 额外包裹 {shipped.reduce((sum, stack) => sum + stack.count, 0)} 件 · 等待回城结算</span>}
    </div>
    {open && <MessengerPanel backpack={backpack} shipped={shipped} onSend={send} onClose={() => setOpen(false)} />}
  </>;
}
