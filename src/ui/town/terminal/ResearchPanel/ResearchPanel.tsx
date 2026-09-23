// 研究中心常驻界面: 左侧导航只替换窗口内容, 三页共用同一套页眉读数与换页演出。
import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import { useTownStore } from "@/store/town/townStore";
import { useSwapTransition } from "@/ui/hooks/useSwapTransition";
import { ShopHeader } from "@/ui/town/shop/ShopHeader";
import { NavigationRail } from "@/ui/town/shop/ShopNavigation";
import { ShopWindow } from "@/ui/town/shop/ShopWindow";
import { CraftView } from "../CraftView";
import { ModuleAssemblyView } from "../ModuleAssemblyView";
import { ResearchTechView } from "../ResearchTechView";
import { AssemblyIcon, CraftIcon, TechTreeIcon } from "./icons";
import s from "./ResearchPanel.module.css";

type ResearchPage = "assembly" | "craft" | "tech";

const ENTRIES = [
  { id: "assembly", label: "模组装配", subLabel: "EQUIPMENT", icon: <AssemblyIcon /> },
  { id: "craft", label: "模组制造", subLabel: "MANUFACTURE", icon: <CraftIcon /> },
  { id: "tech", label: "科技树", subLabel: "TECH TREE", icon: <TechTreeIcon /> },
] as const;

const TITLES: Record<ResearchPage, string> = {
  assembly: "模组装配",
  craft: "模组制造",
  tech: "科技树",
};

const SUBTITLES: Record<ResearchPage, string> = {
  assembly: "把库存模组装进卡牌，随时拆卸重来。",
  craft: "消耗经验与材料，铸造角色专属模组。",
  tech: "投入积分与水晶，推进据点的长期研究。",
};

const PAGE_LEAVE_MS = 170;
const PAGE_ENTER_MS = 280;

export function ResearchPanel({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<ResearchPage>("assembly");
  const { value: shownView, phase } = useSwapTransition(view, view, PAGE_LEAVE_MS, PAGE_ENTER_MS);
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const loot = useTownStore((state) => state.loot);

  const moduleCount = useMemo(
    () => storage.filter((stack) => getItemDef(stack.itemId).category === "module").length,
    [storage],
  );
  const installedCount = Object.values(characters).reduce(
    (count, character) => count + character.deck.filter((card) => card.cardModule).length,
    0,
  );

  return (
    <>
      <NavigationRail entries={ENTRIES} value={view} onChange={setView} ariaLabel="研究中心功能" />
      <ShopWindow
        className={s.window}
        frameTone="red"
        ariaLabel={TITLES[shownView]}
        header={
          <ShopHeader
            title={TITLES[shownView]}
            subtitle={SUBTITLES[shownView]}
            stats={
              <>
                <ResearchStat label="终端积分" value={loot.toLocaleString()} />
                <ResearchStat label="库存模组" value={String(moduleCount)} />
                <ResearchStat label="已装配" value={String(installedCount)} />
              </>
            }
            onBack={onBack}
            closeLabel="关闭研究中心，返回据点"
          />
        }
      >
        <div className={s.page} data-page-phase={phase}>
          {shownView === "assembly" && <ModuleAssemblyView />}
          {shownView === "craft" && <CraftView />}
          {shownView === "tech" && <ResearchTechView />}
        </div>
      </ShopWindow>
    </>
  );
}

function ResearchStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
