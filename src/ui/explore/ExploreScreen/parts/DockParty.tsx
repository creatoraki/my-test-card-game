import { getItemDef } from "@/data";
import type { ExploreState } from "@/explore/types";
import { useTownStore } from "@/store/town/townStore";
import { PartyMemberCard } from "@/ui/common/unit/PartyMemberCard";
import type { ExploreInventoryState } from "../useExploreInventory";
import s from "./DockParty.module.css";

/**
 * 底栏立绘段。平时点立绘看角色详情; 背包里点了需要指定对象的物品后进入「选人」态:
 * 段顶挂出物品名 + 取消, 可选队员框呼吸描边, 悬浮出选中外框, 阵亡队员压灰不可点, 选错闪红。
 */
export function DockParty({ session, inventory, locked }: {
  session: ExploreState;
  inventory: ExploreInventoryState;
  locked: boolean;
}) {
  const characters = useTownStore((state) => state.characters);
  const picking = Boolean(inventory.target);
  return <div className={s.party} data-picking={picking || undefined} data-guide-anchor="party">
    {inventory.target && <div className={s.pickHead}>
      <span className={s.pickLabel}>使用</span>
      <b className={s.pickItem}>{getItemDef(inventory.target.itemId).name}</b>
      <button type="button" className={s.pickCancel} onClick={() => inventory.setTarget(null)}>取消</button>
    </div>}
    <div className={s.members}>
      {session.party.map((item) => {
        const disabled = locked || (picking && !item.alive);
        const rejected = inventory.rejected?.charId === item.charId ? inventory.rejected : null;
        return <div className={s.slot} key={item.charId} data-disabled={disabled || undefined}>
          <PartyMemberCard charId={item.charId} as="button"
            name={item.name} emoji={item.emoji} hp={item.hp} hpLimit={item.hpLimit} maxHp={item.maxHp}
            pollution={characters[item.charId]?.pollution ?? 0} down={!item.alive} className={s.member}
            onClick={disabled ? undefined : () => inventory.chooseMember(item.charId)} />
          <span className={s.frame} aria-hidden><i /><i /><i /><i /></span>
          {rejected && <span key={rejected.seq} className={s.reject} aria-hidden />}
        </div>;
      })}
    </div>
  </div>;
}
