import { getItemDef } from "@/data";
import type { ExploreState } from "@/explore/types";
import { deriveStats, useTownStore } from "@/store/townStore";
import BackpackPanel from "@/ui/explore/BackpackPanel";
import BackpackBar from "@/ui/explore/BackpackBar";
import { PicnicPanel } from "@/ui/explore/PicnicSkill";
import { PartyMemberCard } from "@/ui/common/PartyMemberCard";
import { CharacterModal, MODAL_ACCENT } from "@/ui/common/CharacterModal";
import { BurdenGauge } from "@/ui/explore/BurdenGauge";
import { RelicRail } from "./RelicRail";
import { relicsInBackpack } from "@/explore/relics";
import type { ExploreInventoryState } from "./useExploreInventory";
import s from "./CorridorScreen.module.css";

export function ExploreInventory({ session, inventory, locked }: { session: ExploreState; inventory: ExploreInventoryState; locked: boolean }) {
  const characters = useTownStore((state) => state.characters);
  const member = session.party.find((item) => item.charId === inventory.detailCharId);
  const character = inventory.detailCharId ? characters[inventory.detailCharId] : undefined;
  return <>
    <div className={s.backpack} data-locked={locked || undefined}>
      <BackpackBar onUseItem={inventory.useItem} />
    </div>
    <div className={s.burden}><BurdenGauge /><RelicRail stacks={relicsInBackpack(session)} /></div>
    <div className={s.party} data-guide-anchor="party">
      <div className={s.partyCaption}>随行小队 <span>点击队员查看装备与卡组</span></div>
      <div className={s.partyMembers}>
        {session.party.map((item) => <div className={s.memberSlot} key={item.charId}><PartyMemberCard charId={item.charId} as="button"
          name={item.name} emoji={item.emoji} hp={item.hp} hpLimit={item.hpLimit} maxHp={item.maxHp}
          pollution={characters[item.charId]?.pollution ?? 0} down={!item.alive} className={s.member}
          onClick={locked || (inventory.target && !item.alive) ? undefined : () => inventory.chooseMember(item.charId)} /><span className={s.memberName}>{item.name}</span></div>)}
      </div>
    </div>
    {inventory.target && <div className={s.targetBanner} role="status">
      <span>选择队员使用「{getItemDef(inventory.target.itemId).name}」</span>
      <button type="button" onClick={() => inventory.setTarget(null)}>取消</button>
    </div>}
    {inventory.message && <div className={s.toast} role="status">{inventory.message}</div>}
    {inventory.bagOpen && inventory.allowed && <BackpackPanel onClose={() => inventory.setBagOpen(false)} onUse={inventory.useItem} />}
    {inventory.picnicOpen && <PicnicPanel onClose={() => inventory.setPicnicOpen(false)} />}
    {inventory.detailCharId && character && member && <CharacterModal
      charId={inventory.detailCharId} stats={deriveStats(character)} vitals={{ hp: member.hp, hpLimit: member.hpLimit, maxHp: member.maxHp }}
      pollution={character.pollution} sick={character.sick} quirks={character.quirks} down={!member.alive}
      deck={character.deck} equipped={character.equipped} accent={MODAL_ACCENT.explore} closing={false}
      onClose={() => inventory.setDetailCharId(null)}
      swap={{ candidates: session.backpack.filter((item) => getItemDef(item.itemId).category === "equipment"),
        disabledReason: !inventory.allowed ? "此时无法换装" : !member.alive ? "阵亡队员无法换装" : undefined,
        onEquip: inventory.equip, onUnequip: inventory.unequip }} />}
  </>;
}
