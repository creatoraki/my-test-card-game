// 远征途中的装配弹窗 —— 只列本趟出战队伍(阵亡队员列出但不可选: 卡组还在, 这趟用不上了)。
//   · source = "loot"     待拾取框里的模组: 装成了不占背包格, 顶下来的旧模组进待拾取框。
//   · source = "backpack" 背包里的模组: 顶下来的旧模组原位回到这一格(净 0 格)。

import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import { installBackpackModule } from "@/store/explore/moduleActions";
import { ModuleInstallDialog, type InstallMember } from "./ModuleInstallDialog";

export type ExploreInstallSource = "loot" | "backpack";

interface Props {
  stack: ItemStack;
  source: ExploreInstallSource;
  onClose: () => void;
}

export function ExploreModuleInstall({ stack, source, onClose }: Props) {
  const party = useExploreStore((state) => state.session?.party ?? []);
  const installLootModule = useExploreStore((state) => state.installLootModule);
  const members: InstallMember[] = party.map((member) => ({
    charId: member.charId,
    disabled: !member.alive,
    tag: member.alive ? undefined : "阵亡",
  }));

  return (
    <ModuleInstallDialog
      stack={stack}
      members={members}
      kicker={source === "loot" ? "原地装配" : "远征装载"}
      returnTo={source === "loot" ? "待拾取框" : "背包原位"}
      onConfirm={(charId, cardUid) =>
        source === "loot"
          ? installLootModule(stack.uid, charId, cardUid)
          : installBackpackModule(stack.uid, charId, cardUid)
      }
      onClose={onClose}
    />
  );
}
