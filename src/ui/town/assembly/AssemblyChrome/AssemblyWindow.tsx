import type { ReactNode } from "react";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { ShopWindow } from "@/ui/town/shop/ShopWindow";
import { ShopHeader } from "@/ui/town/shop/ShopHeader";
import type { SwapPhase } from "@/ui/hooks/useSwapTransition";
import theme from "../assemblyTheme.module.css";
import type { AssemblyPage } from "./AssemblyNavigation";
import s from "./AssemblyWindow.module.css";
interface Props {
  ariaLabel: string;
  page: AssemblyPage;
  phase: SwapPhase;
  onBack?: () => void;
  children: ReactNode;
}
// 面板层按实际展示页切换配色，场景层主题保持两色混合不变。
export function AssemblyWindow({ ariaLabel, page, phase, onBack, children }: Props) {
  const credits = useTownStore((state) => state.loot);
  return <ShopWindow frameTone="theme" className={cx(s.window, theme.panel, page === "reforge" && theme.reforge)}
    ariaLabel={ariaLabel} header={
    <ShopHeader title={ariaLabel} subtitle="强化装备，重塑羁绊。" credits={credits}
      onBack={onBack} closeLabel="关闭工房，返回据点" />
  }><div className={s.page} data-page-phase={phase}>{children}</div></ShopWindow>;
}
