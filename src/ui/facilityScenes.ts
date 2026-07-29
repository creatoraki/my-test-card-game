// ============================================================================
// 据点「进入设施」演出的预设表(纯 UI 表现层)。
// 与 transitions.ts / animations.ts 同一套哲学: 时长与坐标常量的唯一真相在 TS,
// 视觉在 ui/TownScreen.css; JS 只负责时序编排, 不引入任何动画库。
//
// 一次进设施 = 镜头推向该设施在大厅里的位置(约 2s, 一镜到底不停顿)
//            + 期间信息条/6 块设施砖/重置按钮逐个错峰飞出屏幕
//            + 运镜结束后大厅背景淡出、设施自己的背景淡入。
// 返回则是同一套动画的反向播放(时长压缩)。
//
// ★ 所有坐标都是「设计 px」(1920×1080 基准, 见 ui/stage.ts) —— 与 TownScreen 里的
//   内联 style 同一坐标系, 任何分辨率下构图逐 px 一致。
// ============================================================================

import { STAGE } from "./stage";
import cryoBg from "../assets/场景/冬眠仓.png";
import trainingBg from "../assets/场景/训练室.png";
import worklogBg from "../assets/场景/控制终端.png";

// ── 设施场景登记处 ──
// 加一个设施 = 这里加一行数据(背景图 + 焦点 + 倍数), 组件一行都不用动。
// 键必须与 TownScreen 里 FACILITIES 的 id 一致; 未登记的设施点了不会有演出。
export interface FacilityScene {
  bg: string; // 该设施自己的背景图(16:9, 与画布同比例 ⇒ cover 只等比缩放, 无裁切无变形)
  focus: { x: number; y: number }; // 推镜焦点(设计 px): 镜头要对准大厅里的哪个点
  scale: number; // 放大倍数
}

export const FACILITY_SCENES: Record<string, FacilityScene> = {
  // 冬眠仓在大厅画面的左下: 焦点取「左 10% / 距底 40%」。
  cryo: { bg: cryoBg, focus: { x: 192, y: 648 }, scale: 1.8 },
  // 训练室取右侧的对称位。★ 构图不满意就改这两个数, 别去动组件或 CSS。
  training: { bg: trainingBg, focus: { x: 1128, y: 148 }, scale: 1.8 },
  // 控制终端对准大厅右侧二层平台下那排蓝色屏幕(霓虹招牌下方的控制台)。
  // 与另外两处刻意分居画面三个不同区域, 三段运镜才不会看着像同一个镜头。
  worklog: { bg: worklogBg, focus: { x: 1360, y: 620 }, scale: 1.8 },
};

export const hasFacilityScene = (id: string): boolean => id in FACILITY_SCENES;

const held: HTMLImageElement[] = []; // 持有引用, 避免解码结果被 GC
let warmed = false;

// 预热: 设施背景约 2.6~2.9MB, 远超 Vite 的内联阈值 ⇒ 各是一个独立请求。不预热的话, 运镜
// 结束那一刻图可能还没到, 交叉淡会淡进一片兜底底色。据点一挂载就开始拉。
// 幂等(据点一挂载就开始拉, 有 2.4s 运镜的余量), StrictMode 下 effect 双调用也安全(与 battleBg.ts warmBattleBg 同写法)。
export function warmFacilityBg(): void {
  if (warmed) return;
  warmed = true;
  for (const scene of Object.values(FACILITY_SCENES)) {
    const img = new Image();
    img.src = scene.bg;
    held.push(img);
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
  // 何时开始交叉淡。★ 刻意早于 camera: 推进末尾是缓出, 最后几百 ms 镜头几乎不动, 若等它跑完
  // 才开始淡, 观感就是「推完了顿一下才转场」。让淡入压在这条尾巴上 ⇒ 镜头还在走时画面已开始转,
  // 两件事咬合成一个动作。改大 = 更像先停再转, 改小 = 转场更抢戏。
  crossfadeAt: 1560,
  // 大厅淡出 / 设施背景淡入(同时进行)。调长一点是为了让两张图有充分的重叠期,
  // 读起来是「化」过去而不是「切」过去; 返回时同一条时长也走一遍(要留在 leave 之内)。
  crossfade: 1100,
  backBtnIn: 320, // 「返回据点」按钮淡入
  leave: 1400, // 返回据点: 整套反向播放的总时长
  leaveFlyIn: 520, // 返回时元素飞回的单个时长
  reduced: 260, // 「减少动态效果」下的压缩时长: 只做一次背景交叉淡
} as const;

// 进设施的总时长 = 运镜 + 交叉淡
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

// 左下角的「重置存档」→ 往左下飞。
export const FLY_RESET: FlyOut = { delay: 320, ms: 340, dx: -300, dy: 160, rot: -6 };

// 右侧面板的设施砖 → 一律往右出画。按马赛克阅读序取用(见 FACILITIES 的顺序),
// 五组参数刻意长短不一 ⇒ 明显不同步。被点击的那块不用这里的参数, 见 FLY_PICKED。
export const FLY_TILES: FlyOut[] = [
  { delay: 140, ms: 380, dx: 760, dy: -40, rot: 5 },
  { delay: 260, ms: 460, dx: 780, dy: 30, rot: -3 },
  { delay: 380, ms: 340, dx: 740, dy: 60, rot: 6 },
  { delay: 500, ms: 500, dx: 800, dy: -30, rot: -5 },
  { delay: 620, ms: 420, dx: 760, dy: 50, rot: 4 },
];

// 被点击的那块最后飞: 先亮一下(--pick-ms 的高亮)当作「就是它」的确认反馈, 再飞出。
export const FLY_PICKED: FlyOut = { delay: 780, ms: 560, dx: 820, dy: -60, rot: -7 };
export const PICK_FLASH = 220; // ms: 确认高亮的时长

// 返回时飞回的顺序与进入相反(最后飞出的最先飞回), 故这里只给「第 i 个飞回」的延迟。
// 次序: 被点击的砖(0) → 其余砖倒序(1~5) → 重置存档(6) → 信息条(7)。
// 起步的 240ms 是刻意留的: 让背景先交叉淡回大厅, 元素才不会飞在还没淡掉的设施背景上。
// 末位算完 = 240 + 7×70 + leaveFlyIn = 1250ms, 仍在 leave(1400ms) 之内。
export const flyBackDelay = (i: number): number => 240 + i * 70;
