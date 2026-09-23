import { lazy, Suspense, useEffect } from "react";
import { useRunStore, type Screen } from "./store/runStore";
import { ScreenTransition } from "@/ui/app/ScreenTransition";
import { MenuScreen } from "@/ui/menu/MenuScreen";
import { TownScreen } from "@/ui/town/TownScreen";
import { FormationScreen } from "@/ui/character/FormationScreen";
import { SortieScreen } from "@/ui/sortie/SortieScreen";
import { ElevatorScene } from "@/ui/elevator/ElevatorScene";
import { ExploreScreen } from "@/ui/explore/ExploreScreen";
import { BattleScreen } from "@/ui/battle/BattleScreen";
import { EndScreen } from "@/ui/result/EndScreen";
import { startGameAssetPreload } from "@/ui/art/assetPreloader";
import { useBgm } from "@/ui/hooks/useBgm";
import { useSfx } from "@/ui/hooks/useSfx";
import { GuideSpotlight } from "@/ui/common/GuideSpotlight";
import { ConfirmDialog } from "@/ui/common/ConfirmDialog";

// 演示页只在开发环境存在: 生产构建里 import.meta.env.DEV 恒为 false, 整个动态 import 分支会被摇树删掉,
// 约 2.8 万行演示代码不会进入生产包。⚠ 正式代码不得反向引用 ui/test 下的任何文件。
const TestScreen = import.meta.env.DEV
  ? lazy(() => import("@/ui/test/TestScreen").then((m) => ({ default: m.TestScreen })))
  : null;

// 界面 → 组件。抽成纯函数是为了让 ScreenTransition 能在出场期间继续渲染「旧」界面。
function renderScreen(screen: Screen) {
  switch (screen) {
    case "town":
      return <TownScreen />;
    // ⚠ 角色详情**没有**自己的 case: 它是编队页内部的一种态(见 FormationScreen 头部注释)。
    case "formation":
      return <FormationScreen />;
    case "sortie":
      return <SortieScreen />;
    case "elevator":
      return <ElevatorScene />;
    case "explore":
      return <ExploreScreen />;
    case "battle":
      return <BattleScreen />;
    case "victory":
    case "defeat":
      return <EndScreen />;
    case "menu":
    default:
      return <MenuScreen />;
  }
}

export default function App() {
  const isTestPage = TestScreen !== null && new URLSearchParams(window.location.search).get("page") === "test";
  useBgm(!isTestPage);
  useSfx(!isTestPage);

  useEffect(() => {
    if (isTestPage) return;
    void startGameAssetPreload();
  }, [isTestPage]);

  const screen = useRunStore((s) => s.screen);
  if (isTestPage && TestScreen) {
    return (
      <Suspense fallback={null}>
        <TestScreen />
      </Suspense>
    );
  }

  return (
    <>
      <ScreenTransition screen={screen} render={renderScreen} />
      <GuideSpotlight />
      <ConfirmDialog />
    </>
  );
}
