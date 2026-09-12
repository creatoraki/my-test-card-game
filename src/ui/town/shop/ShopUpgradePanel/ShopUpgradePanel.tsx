import { useEffect, useMemo, useRef, useState } from "react";
import { useTownStore } from "@/store/townStore";
import { TechnologyBoard } from "@/ui/common/techTree/TechnologyBoard";
import { SHOP_TECHNOLOGY_CANVAS, SHOP_TECHNOLOGY_CORE, shopTechnologyNodes } from "./UpgradeTree";
import s from "./ShopUpgradePanel.module.css";

export function ShopUpgradePanel({ onBack }: { onBack: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const techs = useTownStore((state) => state.shop.techs);
  const upgradeShop = useTownStore((state) => state.upgradeShop);
  const nodes = useMemo(() => shopTechnologyNodes(techs, storage), [techs, storage]);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    nodes.find((node) => node.state === "available")?.id
    ?? nodes.find((node) => node.state === "lacking")?.id
    ?? nodes[0]?.id ?? null,
  );

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  return (
    <div
      ref={rootRef}
      className={s.panel}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onBack();
      }}
    >
      <TechnologyBoard
        nodes={nodes}
        core={SHOP_TECHNOLOGY_CORE}
        canvas={SHOP_TECHNOLOGY_CANVAS}
        selectedId={selectedId}
        credits={loot}
        returnLabel="返回商店"
        onSelect={setSelectedId}
        onResearch={upgradeShop}
        onClose={onBack}
      />
    </div>
  );
}
