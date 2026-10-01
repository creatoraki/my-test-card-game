import { useCallback } from "react";
import type { ExploreState } from "@/explore/types";
import { travelByBeacon } from "@/store/explore/exploreCorridor";
import BackpackPanel from "@/ui/explore/BackpackPanel";
import { PicnicPanel } from "@/ui/explore/PicnicSkill";
import Minimap from "@/ui/explore/Minimap";
import MinimapAtlas from "@/ui/explore/Minimap/parts/MinimapAtlas";
import { PartyDossier } from "@/ui/explore/PartyDossier";
import type { ExploreInventoryState } from "../useExploreInventory";
import s from "../CorridorScreen.module.css";

/** 立绘、随身背包、负重读数与随身遗物已并入底部 ExploreDock；这里只留左上角小地图与各类浮层。 */
export function ExploreInventory({ session, inventory }: { session: ExploreState; inventory: ExploreInventoryState }) {
  const { setAtlasOpen } = inventory;
  // 稳定引用, 让 memo 过的小地图在无关提交时跳过渲染。
  const expandAtlas = useCallback(() => setAtlasOpen(true), [setAtlasOpen]);
  return <>
    <div className={s.corner}>
      {session.dungeon && session.corridor && <Minimap
        dungeon={session.dungeon}
        corridor={session.corridor}
        onExpand={inventory.allowed ? expandAtlas : undefined}
      />}
    </div>
    {/* 信标传送选房改在展开大图里进行, 小地图只显示当前房间周边, 远处的房间点不到。 */}
    {(inventory.atlasOpen || inventory.beaconPicking) && session.dungeon && session.corridor && <MinimapAtlas
      dungeon={session.dungeon}
      corridor={session.corridor}
      picking={inventory.beaconPicking}
      onPick={(roomId) => { travelByBeacon(roomId); inventory.setBeaconPicking(false); inventory.setAtlasOpen(false); }}
      onClose={() => { inventory.setAtlasOpen(false); inventory.setBeaconPicking(false); }}
    />}
    {/* 选人使用物品: 压暗场景让底栏立绘成为唯一焦点, 点空白处取消; 提示文字与取消按钮挂在立绘段上(见 PartyPicker)。 */}
    {inventory.target && <div className={s.pickScrim} aria-hidden onClick={() => inventory.setTarget(null)} />}
    {inventory.bagOpen && inventory.allowed && <BackpackPanel onClose={() => inventory.setBagOpen(false)} onUse={inventory.useItem} />}
    {inventory.picnicOpen && <PicnicPanel onClose={() => inventory.setPicnicOpen(false)} />}
    {/* 队员档案: 页签与浮层状态挂在 PartyDossier 自身, 换队员只换 charId, 不重新挂载。 */}
    {inventory.detailCharId && <PartyDossier
      session={session} charId={inventory.detailCharId} pendingUid={inventory.equipPendingUid} allowed={inventory.allowed}
      onSelect={inventory.setDetailCharId} onEquip={inventory.equip} onUnequip={inventory.unequip}
      onCancelPending={() => inventory.setEquipPendingUid(null)} onClose={inventory.closeDetail} />}
  </>;
}
