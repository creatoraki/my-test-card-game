import type { ReactNode } from "react";
import { useTownStore } from "@/store/townStore";
import { ShopWindow } from "@/ui/town/shop/ShopWindow";
import { ShopHeader } from "@/ui/town/shop/ShopHeader";
import type { SwapPhase } from "@/ui/hooks/useSwapTransition";
import s from "./AssemblyWindow.module.css";
interface Props {
  ariaLabel: string;
  phase: SwapPhase;
  onBack?: () => void;
  children: ReactNode;
}
export function AssemblyWindow({ ariaLabel, phase, onBack, children }: Props) {
  const credits = useTownStore((state) => state.loot);
  return <ShopWindow frameTone="theme" className={s.window} ariaLabel={ariaLabel} header={
    <ShopHeader title={ariaLabel} subtitle="强化装备，重塑羁绊。" credits={credits}
      onBack={onBack} closeLabel="关闭工房，返回据点" />
  }><div className={s.page} data-page-phase={phase}>{children}</div></ShopWindow>;
}
