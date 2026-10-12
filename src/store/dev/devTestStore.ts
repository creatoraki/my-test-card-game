// 测试开关 —— 只在环境变量 isTest=true 时生效, 由探索页小地图旁的调试面板切换。
// 取代旧的 BattleTest 环境变量: 改开关不必重启开发服务器。
// 开关值存 localStorage, 刷新页面后保留; 读写失败(隐私模式等)就退回默认关闭。

import { create } from "zustand";

export const IS_TEST_ENV = import.meta.env.isTest === "true";

const STORAGE_KEY = "dev-test-toggles";

export interface DevTestToggles {
  /** 关闭遇敌: 行走中不再掷暗雷。 */
  noEncounter: boolean;
  /** 测试战斗: 建局时所有敌人只有 1 点生命。 */
  oneHpEnemies: boolean;
}

interface DevTestStore extends DevTestToggles {
  toggle: (key: keyof DevTestToggles) => void;
}

const DEFAULTS: DevTestToggles = { noEncounter: false, oneHpEnemies: false };

function load(): DevTestToggles {
  if (!IS_TEST_ENV) return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw) as Partial<DevTestToggles>;
    return { noEncounter: saved.noEncounter === true, oneHpEnemies: saved.oneHpEnemies === true };
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
    const next = { noEncounter: get().noEncounter, oneHpEnemies: get().oneHpEnemies, [key]: !get()[key] };
    set(next);
    save(next);
  },
}));

/** 非测试环境恒为 false, 调用方无需再判断环境变量。 */
export function devTestFlag(key: keyof DevTestToggles): boolean {
  return IS_TEST_ENV && useDevTestStore.getState()[key];
}
