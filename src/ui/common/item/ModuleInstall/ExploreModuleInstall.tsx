// 远征途中的装配弹窗 —— 只列本趟出战队伍(阵亡队员列出但不可选: 卡组还在, 这趟用不上了)。
// 只装背包里的模组(拾取框 / 战利品里的模组要先拾取进背包): 顶下来的旧模组原位回到这一格(净 0 格)。

import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import { installBackpackModule } from "@/store/explore/moduleActions";
import { ModuleInstallDialog, type InstallMember } from "./ModuleInstallDialog";

interface Props {
  stack: ItemStack;
  onClose: () => void;
}

export function ExploreModuleInstall({ stack, onClose }: Props) {
  const party = useExploreStore((state) => state.session?.party ?? []);
  const members: InstallMember[] = party.map((member) => ({
    charId: member.charId,
    disabled: !member.alive,
    tag: member.alive ? undefined : "阵亡",
  }));

  return (
    <ModuleInstallDialog
      stack={stack}
      members={members}
      kicker="远征装载"
      returnTo="背包原位"
      onConfirm={(charId, cardUid) => installBackpackModule(stack.uid, charId, cardUid)}
      onClose={onClose}
    />
  );
}
