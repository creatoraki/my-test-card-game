import { useRunStore } from "./store/runStore";
import { MenuScreen } from "./ui/MenuScreen";
import { TownScreen } from "./ui/TownScreen";
import { FormationScreen } from "./ui/FormationScreen";
import { ExpeditionScreen } from "./ui/ExpeditionScreen";
import { BattleScreen } from "./ui/BattleScreen";
import { ExpRewardScreen } from "./ui/ExpRewardScreen";
import { EndScreen } from "./ui/EndScreen";

export default function App() {
  const screen = useRunStore((s) => s.screen);

  switch (screen) {
    case "town":
      return <TownScreen />;
    case "formation":
      return <FormationScreen />;
    case "expedition":
      return <ExpeditionScreen />;
    case "battle":
      return <BattleScreen />;
    case "reward":
      return <ExpRewardScreen />;
    case "victory":
      return <EndScreen win />;
    case "defeat":
      return <EndScreen win={false} />;
    case "menu":
    default:
      return <MenuScreen />;
  }
}
