// 据点仓库的装配弹窗 —— 列全部已唤醒角色; 新模组出仓, 顶下来的旧模组回仓。

import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/town/townStore";
import { ModuleInstallDialog, type InstallMember } from "./ModuleInstallDialog";

interface Props {
  stack: ItemStack;
  onClose: () => void;
}

export function TownModuleInstall({ stack, onClose }: Props) {
  const awakened = useTownStore((state) => state.awakened);
  const installStoredModule = useTownStore((state) => state.installStoredModule);
  const members: InstallMember[] = awakened.map((charId) => ({ charId }));

  return (
    <ModuleInstallDialog
      stack={stack}
      members={members}
      kicker="仓库装载"
      returnTo="仓库"
      onConfirm={(charId, cardUid) => installStoredModule(charId, cardUid, stack.uid)}
      onClose={onClose}
    />
  );
}
