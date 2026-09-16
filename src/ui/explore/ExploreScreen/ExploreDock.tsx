import { canRetreat } from "@/explore/session";
import type { ExploreState } from "@/explore/types";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import BackpackBar from "@/ui/explore/BackpackBar";
import { BeaconButton } from "@/ui/explore/BeaconSkill";
import { PicnicButton } from "@/ui/explore/PicnicSkill";
import { PartyMemberCard } from "@/ui/common/PartyMemberCard";
import type { ExploreInventoryState } from "./useExploreInventory";
import s from "./ExploreDock.module.css";

/** 底部整条 HUD：左段立绘(与战斗等尺寸)、中段随身背包、右段行动按钮。 */
export function ExploreDock({ session, inventory, locked, pending }: {
  session: ExploreState;
  inventory: ExploreInventoryState;
  locked: boolean;
  pending: boolean;
}) {
  const characters = useTownStore((state) => state.characters);
  return <div className={s.dock}>
    <div className={s.party} data-guide-anchor="party">
      <div className={s.partyMembers}>
        {session.party.map((item) => <div className={s.memberSlot} key={item.charId}><PartyMemberCard charId={item.charId} as="button"
          name={item.name} emoji={item.emoji} hp={item.hp} hpLimit={item.hpLimit} maxHp={item.maxHp}
          pollution={characters[item.charId]?.pollution ?? 0} down={!item.alive} className={s.member}
          onClick={locked || (inventory.target && !item.alive) ? undefined : () => inventory.chooseMember(item.charId)} /><span className={s.memberName}>{item.name}</span></div>)}
      </div>
    </div>
    <div className={s.backpack} data-locked={locked || undefined}>
      <BackpackBar onUseItem={inventory.useItem} />
    </div>
    <div className={s.actions}>
      <BeaconButton onPick={() => inventory.setBeaconPicking(true)} />
      <PicnicButton onOpen={() => inventory.setPicnicOpen(true)} />
      <button className={s.retreat} type="button" disabled={!canRetreat(session) || locked || pending || inventory.blocked}
        onClick={() => useRunStore.getState().retreat()}>撤离远征</button>
    </div>
  </div>;
}
