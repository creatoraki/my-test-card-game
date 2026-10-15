// 测试开关 —— 总开关「测试模式」在据点右上角设置面板里切换, 测试者随时可开关, 不再读环境变量。
// 测试模式开启时: 地图/难度/据点建筑全部开放、跳过电梯过场、设置面板出现「测试奖励」,
// 探索页小地图旁挂出调试面板(关闭遇敌 / 测试战斗两个子开关)。
// 开关值存 localStorage, 刷新页面后保留; 读写失败(隐私模式等)就退回默认关闭。

import { create } from "zustand";

const STORAGE_KEY = "dev-test-toggles";

export interface DevTestToggles {
  /** 测试模式总开关: 关闭时下面的子开关一律视为关闭。 */
  testMode: boolean;
  /** 关闭遇敌: 行走中不再掷暗雷。 */
  noEncounter: boolean;
  /** 测试战斗: 建局时所有敌人只有 1 点生命。 */
  oneHpEnemies: boolean;
}

interface DevTestStore extends DevTestToggles {
  toggle: (key: keyof DevTestToggles) => void;
}

const DEFAULTS: DevTestToggles = { testMode: false, noEncounter: false, oneHpEnemies: false };

function load(): DevTestToggles {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw) as Partial<DevTestToggles>;
    return {
      testMode: saved.testMode === true,
      noEncounter: saved.noEncounter === true,
      oneHpEnemies: saved.oneHpEnemies === true,
    };
  } catch {
    return DEFAULTS;
  }
}

function save(toggles: DevTestToggles): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
  } catch {
    // 存不下只影响刷新后的记忆, 当前会话照常生效。
  }
}

export const useDevTestStore = create<DevTestStore>((set, get) => ({
  ...load(),
  toggle: (key) => {
    const { testMode, noEncounter, oneHpEnemies } = get();
    const next = { testMode, noEncounter, oneHpEnemies, [key]: !get()[key] };
    set(next);
    save(next);
  },
}));

/** 组件内订阅测试模式: 切换后界面立即刷新。 */
export function useTestMode(): boolean {
  return useDevTestStore((state) => state.testMode);
}

/** 非组件处(store / 一次性判断)读取当前测试模式。 */
export function isTestMode(): boolean {
  return useDevTestStore.getState().testMode;
}

/** 测试模式关闭时恒为 false, 调用方无需再判断总开关。 */
export function devTestFlag(key: Exclude<keyof DevTestToggles, "testMode">): boolean {
  const state = useDevTestStore.getState();
  return state.testMode && state[key];
}
