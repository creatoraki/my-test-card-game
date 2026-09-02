// 装备面板 —— 上面是三类部位槽, 点某个部位后下面展开对应仓库。
//
// ★ 旧版把部位槽塞在属性栏顶部、仓库开在最右一栏, 两者隔着半个屏幕; 现在同处一个 tab,
//   "点部位 → 挑一件 → 看变化" 是一条连贯动作。穿戴/卸下仍直接落 townStore, 无中间态。

import type { EquipSlot, ItemStack } from "@/items/types";
import { EquipmentDrawer } from "@/ui/character/EquipmentDrawer";
import { EquipmentSlots } from "@/ui/character/EquipmentSlots";
import s from "./EquipPanel.module.css";

interface Props {
  equipped: Record<EquipSlot, ItemStack | null>;
  activeSlot: EquipSlot | null;
  candidates: ItemStack[];
  onSelect: (slot: EquipSlot) => void;
  onUnequip: (slot: EquipSlot) => void;
  onEquip: (uid: string) => void;
  onCloseDrawer: () => void;
}

export function EquipPanel({
  equipped,
  activeSlot,
  candidates,
  onSelect,
  onUnequip,
  onEquip,
  onCloseDrawer,
}: Props) {
  return (
    <div className={s.panel}>
      <EquipmentSlots
        className={s.slots}
        equipped={equipped}
        activeSlot={activeSlot}
        onSelect={onSelect}
        onUnequip={onUnequip}
      />
      <div className={s.drawer}>
        {activeSlot ? (
          <EquipmentDrawer
            slot={activeSlot}
            current={equipped[activeSlot]}
            candidates={candidates}
            onEquip={onEquip}
            onUnequip={() => onUnequip(activeSlot)}
            onClose={onCloseDrawer}
          />
        ) : (
          <p className={s.hint}>选择上方任意部位, 这里会列出仓库里能穿的那一类装备。</p>
        )}
      </div>
    </div>
  );
}
