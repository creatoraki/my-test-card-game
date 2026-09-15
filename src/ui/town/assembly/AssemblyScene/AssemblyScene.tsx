// 工房设施场景：常驻 HUD 面板内切换装备升阶与羁绊重铸。

import { useState } from "react";
import { cx } from "@/ui/common/cx";
import { HUD_TONE_BLUE } from "@/ui/common/HudPanelShell";
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
      data-assembly-root
      data-leaving={leaving ? "" : undefined}
    >
      <AssemblyBrand />
      <AssemblyNavigation page={view} onChange={setView} />
      <AssemblyWindow
        ariaLabel={shownView === "upgrade" ? "装备升阶面板" : "羁绊重铸面板"}
        tone={shownView === "reforge" ? HUD_TONE_BLUE : undefined}
        phase={phase}
      >
        {shownView === "upgrade" ? <EquipUpgradePanel /> : <EquipReforgePanel />}
      </AssemblyWindow>
      {onBack && <AssemblyBack onClick={onBack} />}
    </div>
  );
}

export default AssemblyScene;
