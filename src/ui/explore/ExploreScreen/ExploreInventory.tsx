import { getItemDef } from "@/data";
import type { ExploreState } from "@/explore/types";
import { deriveStats, useTownStore } from "@/store/townStore";
import BackpackPanel from "@/ui/explore/BackpackPanel";
import { PicnicPanel } from "@/ui/explore/PicnicSkill";
import { CharacterModal, MODAL_ACCENT } from "@/ui/common/CharacterModal";
import { BurdenGauge } from "@/ui/explore/BurdenGauge";
import { RelicRail } from "./RelicRail";
import { relicsInBackpack } from "@/explore/relics";
import type { ExploreInventoryState } from "./useExploreInventory";
import s from "./CorridorScreen.module.css";

/** 立绘与随身背包已并入底部 ExploreDock；这里只留负重读数与各类浮层。 */
export function ExploreInventory({ session, inventory }: { session: ExploreState; inventory: ExploreInventoryState }) {
  const characters = useTownStore((state) => state.characters);
  const member = session.party.find((item) => item.charId === inventory.detailCharId);
  const character = inventory.detailCharId ? characters[inventory.detailCharId] : undefined;
  return <>
    <div className={s.burden}><BurdenGauge /><RelicRail stacks={relicsInBackpack(session)} /></div>
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
