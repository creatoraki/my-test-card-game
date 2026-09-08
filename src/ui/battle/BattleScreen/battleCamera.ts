import type { BattleState } from "@/engine";
import { getEncounter, slotPlacement, type EnemyPlacement } from "@/data";
import { CINEMA } from "@/ui/battle/animations";
import { depthVars, type Camera, type ChoreoStep, worldShift, unitWorldBox } from "@/ui/battle/camera";
import type { ShotPreset } from "@/ui/battle/camera";

export const CAMERA_HARD_CUT_DISTANCE = 420;
export const CAMERA_SETTLE_MS = CINEMA.aim.dur + 80;
export const DEPTH_VARS = depthVars();

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

function safeArea(stage: HTMLElement) {
  return { x: stage.offsetLeft, y: stage.offsetTop, w: stage.offsetWidth, h: stage.offsetHeight };
}

export function placementOf(battle: BattleState, id: string): EnemyPlacement | undefined {
  const index = battle.enemyIds.indexOf(id);
  return index >= 0 ? slotPlacement(getEncounter(battle.encounterId).enemies[index]) : undefined;
}

export function computeAimCamera(
  world: HTMLElement | null,
  stage: HTMLElement | null,
  foeId: string | null,
  placement?: EnemyPlacement,
): Camera | null {
  if (!world || !stage) return null;
  const safe = safeArea(stage);
  const A = { x: safe.x + safe.w / 2, y: safe.y + safe.h / 2 };
  const { scale: s, yaw: yawMax, pitch: pitchMax, pan, panMax, panY, panMaxY, arc } = CINEMA.aim;
  let yaw = 0;
  let pitch = 0;
  const F = { ...A };
  const box = foeId ? unitWorldBox(world, foeId, placement) : null;
  if (box) {
    const offX = (box.left + box.right) / 2 - A.x;
    const offY = (box.top + box.bottom) / 2 - A.y;
    const nx = clamp(offX / (safe.w / 2), 1);
    const ny = clamp(offY / (safe.h / 2), 1);
    yaw = nx * yawMax;
    pitch = -ny * pitchMax;
    F.x += clamp(offX * pan, panMax);
    F.y += clamp(offY * panY, panMaxY) - Math.abs(nx) * arc;
  }
  return { s, ...worldShift(A, F, s), yaw, pitch, roll: 0 };
}

export function computeFocusCamera(
  world: HTMLElement | null,
  stage: HTMLElement | null,
  battle: BattleState,
  focusIds: string[],
  shot: ShotPreset,
): Camera | null {
  if (!world || !stage || focusIds.length === 0) return null;

  // 全程在世界坐标(设计 px)里算, 不出现任何屏幕 px、不需要 --stage-scale ——
  // 故任何窗口尺寸下的推镜结果逐 px 一致。
  //
  // 取景安全区 = .battle-stage 的布局盒(而非整个画布): 目标居中到清晰可见区, 不会跑到
  // 左侧透明手牌栏底下(见上方 safeArea)。
  //
  // 刻意不做边界钳制: 目标永远精确居中, 世界之外露出的部分由 .battle-bg-spill 填充。
  // 这段数学刻意不把屏幕 px 混进来, 也不读取画布外的布局信息; .battle-stage 布局盒就是
  // 唯一的取景安全区, 世界坐标则由 unitWorldBox 统一反投影得到。
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const id of focusIds) {
    const box = unitWorldBox(world, id, placementOf(battle, id));
    if (!box) continue;
    left = Math.min(left, box.left);
    top = Math.min(top, box.top);
    right = Math.max(right, box.right);
    bottom = Math.max(bottom, box.bottom);
  }
  if (!isFinite(left)) return null;

  const safe = safeArea(stage);
  const spanW = Math.max(1, right - left);
  const spanH = Math.max(1, bottom - top);
  const fit = Math.min((safe.w * shot.fit) / spanW, (safe.h * shot.fit) / spanH);
  const s = Math.max(1, Math.min(shot.scale, fit));
  const F = { x: (left + right) / 2, y: (top + bottom) / 2 };
  const A = { x: safe.x + safe.w / 2, y: safe.y + safe.h / 2 };
  const nx = clamp((F.x - A.x) / (safe.w / 2), 1);
  const ny = clamp((F.y - A.y) / (safe.h / 2), 1);
  return {
    s,
    ...worldShift(A, F, s),
    yaw: nx * shot.yaw,
    pitch: -ny * shot.pitch,
    roll: nx === 0 ? 0 : shot.roll * Math.sign(nx),
  };
}

export function impactAxis(
  world: HTMLElement | null,
  battle: BattleState,
  step: ChoreoStep,
  targetIds: string[],
): { x: number; y: number } {
  const fallback = battle.enemyIds.includes(step.actorId) ? { x: 0, y: 1 } : { x: 0, y: -1 };
  if (!world) return fallback;
  const target = targetIds.map((id) => unitWorldBox(world, id, placementOf(battle, id))).find(Boolean);
  const actor = unitWorldBox(world, step.actorId, placementOf(battle, step.actorId));
  if (!target || !actor) return fallback;
  const tx = (target.left + target.right) / 2;
  const ty = (target.top + target.bottom) / 2;
  const ax = (actor.left + actor.right) / 2;
  const ay = (actor.top + actor.bottom) / 2;
  const length = Math.hypot(tx - ax, ty - ay);
  if (length < 1) return fallback;
  return { x: (tx - ax) / length, y: (ty - ay) / length };
}

export function shouldHardCut(
  battle: BattleState,
  previous: ChoreoStep,
  current: ChoreoStep,
  previousFocus: Camera | null,
  currentFocus: Camera | null,
): boolean {
  const factionChanged = battle.playerIds.includes(previous.actorId) !== battle.playerIds.includes(current.actorId);
  if (factionChanged) return true;
  if (!previousFocus || !currentFocus) return false;
  return Math.hypot(currentFocus.dx - previousFocus.dx, currentFocus.dy - previousFocus.dy) > CAMERA_HARD_CUT_DISTANCE;
}
