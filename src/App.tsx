import { useRunStore } from "./store/runStore";
import { MenuScreen } from "./ui/MenuScreen";
import { BattleScreen } from "./ui/BattleScreen";
import { RewardScreen } from "./ui/RewardScreen";
import { EndScreen } from "./ui/EndScreen";

export default function App() {
  const screen = useRunStore((s) => s.screen);

  switch (screen) {
    case "battle":
      return <BattleScreen />;
    case "reward":
      return <RewardScreen />;
    case "victory":
      return <EndScreen win />;
    case "defeat":
      return <EndScreen win={false} />;
    case "menu":
    default:
      return <MenuScreen />;
  }
}
