import { canRetreat } from "@/explore/session";
import { relicsInBackpack } from "@/explore/relics/relics";
import type { ExploreState } from "@/explore/types";
import { useRunStore } from "@/store/run/runStore";
import BackpackBar from "@/ui/explore/BackpackBar";
import { BurdenGauge } from "@/ui/explore/BurdenGauge";
import { BeaconButton } from "@/ui/explore/BeaconSkill";
import { ExploreActionButton, RetreatIcon } from "@/ui/explore/ExploreActionButton";
import { PicnicButton } from "@/ui/explore/PicnicSkill";
import type { ExploreInventoryState } from "../useExploreInventory";
import { DockFrame } from "./DockFrame";
import { DockParty } from "./DockParty";
import { RelicRail } from "./RelicRail";
import s from "./ExploreDock.module.css";

/** 撤离远征需长按充能确认，防止误触直接结束远征。 */
const RETREAT_HOLD_MS = 1200;

/** 底部整条 HUD：左段立绘(与战斗等尺寸)、右段随身背包；背包段上方一条表头行 = 随身遗物 | 负重读数 + 行动按钮。 */
export function ExploreDock({ session, inventory, locked, pending }: {
  session: ExploreState;
  inventory: ExploreInventoryState;
  locked: boolean;
  pending: boolean;
}) {
  return <div className={s.dock} data-picking={inventory.target ? true : undefined}>
    <DockFrame />
    <DockParty session={session} inventory={inventory} locked={locked} />
    <div className={s.backpack}>
      <div className={s.bagHead}>
        <RelicRail stacks={relicsInBackpack(session)} />
        <div className={s.actions}>
          <BurdenGauge />
          <BeaconButton onPick={() => inventory.setBeaconPicking(true)} />
          <PicnicButton onOpen={() => inventory.setPicnicOpen(true)} />
          <ExploreActionButton tone="alert" icon={<RetreatIcon />} label="撤离远征" badge="长按" holdMs={RETREAT_HOLD_MS} holdLabel="充能撤离…"
            state={!canRetreat(session) || locked || pending || inventory.blocked ? "locked" : "ready"}
            onClick={() => useRunStore.getState().retreat()} />
        </div>
      </div>
      <div className={s.bagGrid} data-locked={locked || undefined}>
        <BackpackBar onUseItem={inventory.useItem} />
      </div>
    </div>
  </div>;
}
