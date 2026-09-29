import type { ExploreState } from "@/explore/types";
import { useTownStore } from "@/store/town/townStore";
import BackpackHand from "@/ui/explore/BackpackHand";
import { PartyMemberCard } from "@/ui/common/unit/PartyMemberCard";
import type { ExploreInventoryState } from "../useExploreInventory";
import s from "./ExploreDock.module.css";

/** 底部整条 HUD：左段立绘(与战斗等尺寸)、右段随身背包手牌。行动按钮在右上角 ExploreActions。 */
export function ExploreDock({ session, inventory, locked }: {
  session: ExploreState;
  inventory: ExploreInventoryState;
  locked: boolean;
}) {
  const characters = useTownStore((state) => state.characters);
  return <div className={s.dock}>
    <div className={s.party} data-guide-anchor="party">
      <div className={s.partyMembers}>
        {session.party.map((item) => <div className={s.memberSlot} key={item.charId}><PartyMemberCard charId={item.charId} as="button"
          name={item.name} emoji={item.emoji} hp={item.hp} hpLimit={item.hpLimit} maxHp={item.maxHp}
          pollution={characters[item.charId]?.pollution ?? 0} down={!item.alive} className={s.member}
          onClick={locked || (inventory.target && !item.alive) ? undefined : () => inventory.chooseMember(item.charId)} /></div>)}
      </div>
    </div>
    <div className={s.backpack} data-locked={locked || undefined}>
      <BackpackHand onUseItem={inventory.useItem} />
    </div>
  </div>;
}
