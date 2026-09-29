import { canRetreat } from "@/explore/session";
import type { ExploreState } from "@/explore/types";
import { useRunStore } from "@/store/run/runStore";
import { BeaconButton } from "@/ui/explore/BeaconSkill";
import { PicnicButton } from "@/ui/explore/PicnicSkill";
import type { ExploreInventoryState } from "../useExploreInventory";
import s from "./ExploreActions.module.css";

/** 右上角行动按钮：净化粒子读数卡正下方竖排 —— 应急信标 / 野餐 / 撤离远征。 */
export function ExploreActions({ session, inventory, locked, pending }: {
  session: ExploreState;
  inventory: ExploreInventoryState;
  locked: boolean;
  pending: boolean;
}) {
  return <div className={s.actions}>
    <BeaconButton onPick={() => inventory.setBeaconPicking(true)} />
    <PicnicButton onOpen={() => inventory.setPicnicOpen(true)} />
    <button className={s.retreat} type="button" disabled={!canRetreat(session) || locked || pending || inventory.blocked}
      onClick={() => useRunStore.getState().retreat()}>
      <span className={s.icon} aria-hidden="true">⛺</span>
      <span className={s.label}>撤离远征</span>
    </button>
  </div>;
}
