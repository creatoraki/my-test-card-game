import { useEffect } from "react";
import { useRunStore, type Screen } from "./store/runStore";
import { ScreenTransition } from "@/ui/app/ScreenTransition";
import { MenuScreen } from "@/ui/menu/MenuScreen";
import { TownScreen } from "@/ui/town/TownScreen";
import { FormationScreen } from "@/ui/character/FormationScreen";
import { CharacterDetailScreen } from "@/ui/character/CharacterDetailScreen";
import { SortieScreen } from "@/ui/sortie/SortieScreen";
import { ElevatorScene } from "@/ui/elevator/ElevatorScene";
import { ExploreScreen } from "@/ui/explore/ExploreScreen";
import { BattleScreen } from "@/ui/battle/BattleScreen";
import { EndScreen } from "@/ui/result/EndScreen";
import { startGameAssetPreload } from "@/ui/art/assetPreloader";
import { useBgm } from "@/ui/hooks/useBgm";
import { useSfx } from "@/ui/hooks/useSfx";
import { TestScreen } from "@/ui/test/TestScreen";

// 界面 → 组件。抽成纯函数是为了让 ScreenTransition 能在出场期间继续渲染「旧」界面。
function renderScreen(screen: Screen) {
  switch (screen) {
    case "town":
      return <TownScreen />;
    case "formation":
      return <FormationScreen />;
    case "charDetail":
      return <CharacterDetailScreen />;
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
  const isTestPage = new URLSearchParams(window.location.search).get("page") === "test";
  useBgm(!isTestPage);
  useSfx(!isTestPage);

  useEffect(() => {
    if (isTestPage) return;
    void startGameAssetPreload();
  }, [isTestPage]);

  const screen = useRunStore((s) => s.screen);
  if (isTestPage) return <TestScreen />;

  return <ScreenTransition screen={screen} render={renderScreen} />;
}
