// ============================================================================
// 据点「进入设施」演出的预设表(纯 UI 表现层)。
// 与 transitions.ts / animations.ts 同一套哲学: 时长常量的唯一真相在 TS,
// 视觉在 TownScreen/TownScreen.module.css; JS 只负责时序编排, 不引入任何动画库。
//
// 一次进设施 = 信息条 / 右上设置 / 左下机器人 / 编队出击坞逐个错峰飞出屏幕
//            + 几乎同时用 PixelSwap 把全景背景像素块化地换成设施自己的背景。
// 返回则是同一套动画的反向播放(时长压缩)。
//
// ⚠ 本页**没有运镜**: 早期版本点建筑会先把镜头推向它、放大再转场, 现已整套去掉 ——
//   点哪栋都是原地换场。相机换算与 townCamPush 关键帧一并删除, 建筑表里也不再有 focus/scale。
// ★ 「哪栋建筑 = 哪个设施 / 哪张背景」不在本文件, 见 TownScreen/stationBuildings.ts。
// ============================================================================

import { preloadImage } from "@/ui/art/assetLoader";
import { STATION_BUILDINGS } from "./TownScreen/stationBuildings";

let warmed = false;

// 预热: 设施背景约 2.6~2.9MB, 远超 Vite 的内联阈值 ⇒ 各是一个独立请求。不预热的话,
// 点建筑那一刻图可能还没到, 像素转场会切进一片兜底底色。据点一挂载就开始拉。
// ⚠ 去掉运镜后留给加载的余量只剩几百毫秒(见下面的 crossfadeAt), 这次预热比以前更要紧。
// 幂等, StrictMode 下 effect 双调用也安全(与 battleBg.ts warmBattleBg 同写法)。
export function warmFacilityBg(): void {
  if (warmed) return;
  warmed = true;
  for (const building of STATION_BUILDINGS) {
    void preloadImage(building.bg).catch(() => {});
  }
}

// ── 时间轴(ms) ──
// 这些数同时喂给 CSS(内联 animationDuration/Delay)与 JS 定时器 ⇒ 单一真相, 两头不会对不上。
export const FACILITY_CINEMA = {
  // 何时开始像素转场。★ 留这一小段而不是 0: 让最先起飞的信息条先动起来, 读起来是
  // 「HUD 让开 → 画面换过去」一个连贯动作; 归 0 则 HUD 与背景同帧一起变, 略显糊。
  // 改大 = 更像先收 HUD 再换场, 改小 = 换场更抢戏。
  crossfadeAt: 220,
  // 像素转场的总时长(下发给 PixelSwap 的 duration): 所有像素块从第一块翻到最后一块。
  // 调长一点是为了让像素块明显错峰, 读起来是「一块块换过去」而不是「整屏切一下」;
  // 返回时同一条时长也走一遍(要留在 leave 之内)。
  crossfade: 1100,
  backBtnIn: 320, // 「返回据点」按钮淡入
  backBtnOut: 300, // 「返回据点」按钮先淡出, 再开始反向像素转场
  leave: 1400, // 返回据点: 整套反向播放的总时长
  leaveFlyIn: 520, // 返回时元素飞回的单个时长
} as const;

// 进设施的总时长 = 起转时刻 + 像素转场跑完
export const ENTER_TOTAL = FACILITY_CINEMA.crossfadeAt + FACILITY_CINEMA.crossfade;

// ── 飞出参数 ──
// 「逐个有序 + 各自有各自的运动时间」: 每个元素一组独立的 delay/ms/位移。
// 位移方向按元素所在的角落取最近的出画方向, 保证飞出路径短且不穿过画面中心。
export interface FlyOut {
  delay: number; // ms
  ms: number; // ms
  dx: number; // 设计 px
  dy: number;
  rot: number; // deg: 一点点旋转, 免得读起来像整块平移的贴纸
}

// 左上角的信息条 → 往左上角飞。第一个走, 给整段退场起个头。
export const FLY_STATUS: FlyOut = { delay: 0, ms: 460, dx: -820, dy: -70, rot: -4 };

// 右上角的设置按钮 → 往右上飞。
export const FLY_SETTINGS: FlyOut = { delay: 120, ms: 380, dx: 320, dy: -160, rot: 6 };

// 左下角的常驻聊天机器人 → 往左下飞。
export const FLY_BOT: FlyOut = { delay: 120, ms: 380, dx: -320, dy: 220, rot: -6 };

// 右下角的「编队 / 出击」坞 → 往右下飞。最后一个走: 它是这一页最重的那块, 留到最后出画。
// ⚠ 去掉运镜后整段进场只有 ENTER_TOTAL(≈1.3s), 四个飞出单元的延迟一并收紧, 免得坞还没飞完背景就换好了。
export const FLY_DOCK: FlyOut = { delay: 240, ms: 460, dx: 760, dy: 190, rot: 5 };

// 返回时飞回的顺序与进入相反(最后飞出的最先飞回), 故这里只给「第 i 个飞回」的延迟。
// 次序: 出击坞(0) → 左下机器人(1) → 右上设置(2) → 信息条(3)。
// 起步的 240ms 是刻意留的: 让背景先像素转场回全景, HUD 才不会飞在还没换掉的设施背景上。
// ⚠ 末位算完 = 240 + 3×90 + leaveFlyIn = 1030ms, 必须留在 leave(1400ms) 之内。
export const flyBackDelay = (i: number): number => 240 + i * 90;
