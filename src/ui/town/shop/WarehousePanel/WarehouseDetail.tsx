// 仓库右侧详情栏: 物品详情卡 + 模组 / 模组箱操作区, 以及它们拉起的装配弹窗与开箱演出。
// 结算都在 townStore(cardModuleSlice), 这里只管弹窗与演出的开关。

import { useState } from "react";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/town/townStore";
import { ModuleCrateReveal } from "@/ui/common/item/ModuleCrateReveal";
import { TownModuleInstall } from "@/ui/common/item/ModuleInstall";
import ShopItemCard from "@/ui/town/shop/ShopItemCard";
import { ShopDetailAside } from "@/ui/town/shop/ShopDetailAside";
import { WarehouseActions } from "./WarehouseActions";

interface Reveal {
  crateItemId: string;
  opened: ItemStack;
}

interface Props {
  stack: ItemStack | null;
  /** 开箱后把选中项切到开出的模组上。 */
  onSelect: (uid: string) => void;
}

export function WarehouseDetail({ stack, onSelect }: Props) {
  const openStoredCrate = useTownStore((state) => state.openStoredCrate);
  const [installing, setInstalling] = useState<ItemStack | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);

  const openCrate = (crate: ItemStack) => {
    const opened = openStoredCrate(crate.uid);
    if (!opened) return;
    onSelect(opened.uid);
    setReveal({ crateItemId: crate.itemId, opened });
  };

  return (
    <>
      <ShopDetailAside heading="物品详情" empty="选择仓库中的物品查看详情">
        {stack && (
          <>
            <ShopItemCard stack={stack} />
            <WarehouseActions stack={stack} onInstall={setInstalling} onOpenCrate={openCrate} />
          </>
        )}
      </ShopDetailAside>
      {reveal && (
        <ModuleCrateReveal
          crateItemId={reveal.crateItemId}
          opened={reveal.opened}
          placeNote="已存入仓库"
          onInstall={() => {
            setInstalling(reveal.opened);
            setReveal(null);
          }}
          onClose={() => setReveal(null)}
        />
      )}
      {installing && <TownModuleInstall stack={installing} onClose={() => setInstalling(null)} />}
    </>
  );
}
