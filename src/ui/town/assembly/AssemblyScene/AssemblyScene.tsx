// 工房设施场景：商店同款常驻面板内切换装备升阶与羁绊重铸。

import { ShopSidebar } from "@/ui/town/shop/ShopSidebar";
import { useState } from "react";
import { cx } from "@/ui/common/cx";
import { useSwapTransition } from "@/ui/hooks/useSwapTransition";
import { EquipReforgePanel } from "../EquipReforgePanel";
import { EquipUpgradePanel } from "../EquipUpgradePanel";
import theme from "../assemblyTheme.module.css";
import { AssemblyBack, AssemblyBrand, AssemblyNavigation, AssemblyWindow, type AssemblyPage } from "../AssemblyChrome";
import s from "./AssemblyScene.module.css";

interface Props {
  leaving?: boolean;
  onBack?: () => void;
}

export function AssemblyScene({ leaving = false, onBack }: Props) {
  const [view, setView] = useState<AssemblyPage>("upgrade");
  const { value: shownView, phase } = useSwapTransition(view, view, 170, 280);

  return (
    <div
      className={cx(theme.theme, s.root)}
      data-shop-root
      data-assembly-root
      data-assembly-page={shownView}
      data-leaving={leaving ? "" : undefined}
    >
      <ShopSidebar />
      <AssemblyBrand />
      <AssemblyNavigation page={view} onChange={setView} />
      <AssemblyWindow
        ariaLabel={shownView === "upgrade" ? "装备升阶面板" : "羁绊重铸面板"}
        onBack={onBack}
        phase={phase}
      >
        {shownView === "upgrade" ? <EquipUpgradePanel /> : <EquipReforgePanel />}
      </AssemblyWindow>
      {onBack && <AssemblyBack onClick={onBack} />}
    </div>
  );
}

export default AssemblyScene;
