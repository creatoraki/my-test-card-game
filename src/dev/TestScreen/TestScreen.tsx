import { EnemyStatusShowcase } from "./enemyStatus/EnemyStatusShowcase";
import s from "./TestScreen.module.css";

export function TestScreen() {
  return (
    <div className={s.root}>
      <EnemyStatusShowcase />
    </div>
  );
}
