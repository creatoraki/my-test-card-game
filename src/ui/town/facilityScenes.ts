// ============================================================================
// 据点「进入设施」演出的预设表(纯 UI 表现层)。
// 与 transitions.ts / animations.ts 同一套哲学: 时长与坐标常量的唯一真相在 TS,
// 视觉在 TownScreen/TownScreen.module.css; JS 只负责时序编排, 不引入任何动画库。
//
// 一次进设施 = 镜头推向该建筑在空间站全景里的位置(约 2s, 一镜到底不停顿)
//            + 期间信息条/招牌/编队出击坞逐个错峰飞出屏幕
//            + 运镜尾段用 PixelSwap 把全景背景像素块化地换成设施自己的背景。
// 返回则是同一套动画的反向播放(时长压缩)。
//
// ★ 所有坐标都是「设计 px」(1920×1080 基准, 见 ui/hooks/stage.ts) —— 与 TownScreen 里的
//   内联 style 同一坐标系, 任何分辨率下构图逐 px 一致。
// ★ 「哪栋建筑 = 哪个设施 / 哪张背景 / 推向哪个焦点」不在本文件, 见 TownScreen/stationBuildings.ts。
// ============================================================================

import { STAGE } from "@/ui/hooks/stage";
import { preloadImage } from "@/ui/art/assetLoader";
import { STATION_BUILDINGS } from "./TownScreen/stationBuildings";

/** 推镜目标: 焦点 + 放大倍数。由建筑表(stationBuildings.ts)提供。 */
export interface FacilityScene {
  focus: { x: number; y: number };
  scale: number;
}

let warmed = false;

// 预热: 设施背景约 2.6~2.9MB, 远超 Vite 的内联阈值 ⇒ 各是一个独立请求。不预热的话, 运镜
// 结束那一刻图可能还没到, 像素转场会切进一片兜底底色。据点一挂载就开始拉。
// 幂等(有 2.4s 运镜的余量), StrictMode 下 effect 双调用也安全(与 battleBg.ts warmBattleBg 同写法)。
export function warmFacilityBg(): void {
  if (warmed) return;
  warmed = true;
  for (const building of STATION_BUILDINGS) {
    void preloadImage(building.bg).catch(() => {});
  }
}

// ── 相机换算 ──
// 与 BattleScreen 的 computeCamera 同一套数学: 配合 transform-origin: 0 0,
// 把焦点 F 映射到画框锚点 A ⇒ T = A - s·F。这里的锚点恒为画布正中。
//
// ★ 焦点先钳制到「安全范围」: 放大 s 倍后可视区只有 1920/s × 1080/s, 若焦点太靠边,
//   把它硬拉到正中会让视野越出画布 ⇒ 露出背景之外的黑边。钳制后镜头贴边停住,
//   焦点仍在屏幕的那一侧(冬眠仓最终落在屏幕左侧约 18%、垂直居中)。
export interface FacilityCamera {
  s: number; // 放大倍数
  tx: number; // 世界 px(= 设计 px)
  ty: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function facilityCamera(scene: FacilityScene): FacilityCamera {
  const s = scene.scale;
  const halfW = STAGE.width / (2 * s);
  const halfH = STAGE.height / (2 * s);
  // s < 1 时安全区为负(可视区比画布还大), 钳到画布中心兜底 —— 正常参数走不到这条分支。
  const cx =
    halfW * 2 >= STAGE.width ? STAGE.width / 2 : clamp(scene.focus.x, halfW, STAGE.width - halfW);
  const cy =
    halfH * 2 >= STAGE.height
      ? STAGE.height / 2
      : clamp(scene.focus.y, halfH, STAGE.height - halfH);
  return { s, tx: STAGE.width / 2 - s * cx, ty: STAGE.height / 2 - s * cy };
}

// ── 时间轴(ms) ──
// 这些数同时喂给 CSS(内联 animationDuration/Delay)与 JS 定时器 ⇒ 单一真相, 两头不会对不上。
export const FACILITY_CINEMA = {
  camera: 2000, // 推镜总时长(节奏由 CSS 里 townCamPush 的关键帧分布决定: 起手 + 一路推进)
  // 何时开始像素转场。★ 刻意早于 camera: 推进末尾是缓出, 最后几百 ms 镜头几乎不动, 若等它跑完
  // 才开始换, 观感就是「推完了顿一下才转场」。让转场压在这条尾巴上 ⇒ 镜头还在走时画面已开始换,
  // 两件事咬合成一个动作。改大 = 更像先停再转, 改小 = 转场更抢戏。
  crossfadeAt: 1560,
  // 像素转场的总时长(下发给 PixelSwap 的 duration): 所有像素块从第一块翻到最后一块。
  // 调长一点是为了让像素块明显错峰, 读起来是「一块块换过去」而不是「整屏切一下」;
  // 返回时同一条时长也走一遍(要留在 leave 之内)。
  crossfade: 1100,
  backBtnIn: 320, // 「返回据点」按钮淡入
  leave: 1400, // 返回据点: 整套反向播放的总时长
  leaveFlyIn: 520, // 返回时元素飞回的单个时长
} as const;

// 进设施的总时长 = 推镜尾段起转 + 像素转场跑完
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

// 左下角的音频开关与「重置存档」→ 往左下飞。
export const FLY_RESET: FlyOut = { delay: 220, ms: 380, dx: -320, dy: 170, rot: -6 };

// 右下角的「编队 / 出击」坞 → 往右下飞。最后一个走: 它是这一页最重的那块,
// 留到最后出画, 观感上像镜头把它甩出画面, 而不是它自己先跑了。
export const FLY_DOCK: FlyOut = { delay: 380, ms: 520, dx: 760, dy: 190, rot: 5 };

// 返回时飞回的顺序与进入相反(最后飞出的最先飞回), 故这里只给「第 i 个飞回」的延迟。
// 次序: 出击坞(0) → 左下按钮组(1) → 信息条(2)。
// 起步的 240ms 是刻意留的: 让背景先像素转场回全景, HUD 才不会飞在还没换掉的设施背景上。
// ⚠ 末位算完 = 240 + 2×90 + leaveFlyIn = 940ms, 必须留在 leave(1400ms) 之内。
export const flyBackDelay = (i: number): number => 240 + i * 90;
