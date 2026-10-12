// 探索页测试面板 —— 只在环境变量 isTest=true 时挂载, 排在左上角小地图右侧。
// 两个开关(关闭遇敌 / 测试战斗)存于 store/dev/devTestStore, 一个动作按钮直接开打本图首领战。

import type { MouseEvent } from "react";
import type { ExploreState } from "@/explore/types";
import { canWalkCorridor } from "@/explore/corridor/corridorSession";
import { IS_TEST_ENV, useDevTestStore, type DevTestToggles } from "@/store/dev/devTestStore";
import { challengeBossTest } from "@/store/explore/exploreCorridor";
import { setTransitionOrigin } from "@/ui/app/shared/transitionOrigin";
import frame from "@/ui/explore/Minimap/MinimapFrame.module.css";
import s from "./DevTestPanel.module.css";

const TOGGLES: { key: keyof DevTestToggles; label: string }[] = [
  { key: "noEncounter", label: "关闭遇敌" },
  { key: "oneHpEnemies", label: "测试战斗" },
];

export function DevTestPanel({ session }: { session: ExploreState }) {
  const toggles = useDevTestStore();
  if (!IS_TEST_ENV) return null;
  const bossReady = canWalkCorridor(session);

  const startBoss = (event: MouseEvent<HTMLButtonElement>) => {
    setTransitionOrigin(event.clientX, event.clientY);
    challengeBossTest();
  };

  return <div className={`${frame.frame} ${s.panel}`} aria-label="测试面板">
    <span className={s.title}>测试</span>
    {TOGGLES.map(({ key, label }) => <button
      key={key}
      type="button"
      className={s.button}
      data-on={toggles[key] || undefined}
      aria-pressed={toggles[key]}
      onClick={() => toggles.toggle(key)}
    >
      <i className={s.lamp} aria-hidden />
      {label}
    </button>)}
    <button type="button" className={`${s.button} ${s.boss}`} disabled={!bossReady} onClick={startBoss}>
      测试首领
    </button>
  </div>;
}
