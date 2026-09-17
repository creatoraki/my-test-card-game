import type { EnemyPlacement } from "@/data";

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function layoutPosition(world: HTMLElement, element: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = element;
  while (current && current !== world) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** 敌人平面单位包裹层的线性化参数: origin = 包裹层左上角, anchor = 视觉中心(含手工站位偏移)。
 *  站位偏移由包裹层的 data-anchor-dx/dy 下发(见 BattleScreen/parts/PlaneUnit)。 */
export function planeUnitAnchor(root: HTMLElement, unit: HTMLElement) {
  const origin = layoutPosition(root, unit);
  const dx = Number(unit.dataset.anchorDx) || 0;
  const dy = Number(unit.dataset.anchorDy) || 0;
  return {
    origin,
    anchor: { x: origin.x + unit.offsetWidth / 2 + dx, y: origin.y + unit.offsetHeight / 2 + dy },
  };
}

export function unitWorldBox(world: HTMLElement, id: string, placement?: EnemyPlacement): Box | null {
  const combatant = world.querySelector<HTMLElement>(`[data-cmb-id="${id}"]`);
  if (!combatant) return null;
  const stage = combatant.querySelector<HTMLElement>("[data-cmb-stage]") ?? combatant;
  const position = layoutPosition(world, stage);
  // 体型缩放已烘进 --fig-h 的布局高度，这里再乘 placement.scale 会造成双倍缩放。
  const width = stage.offsetWidth;
  const height = stage.offsetHeight;
  const dx = placement?.dx ?? 0;
  const dy = placement?.dy ?? 0;
  const centerX = position.x + stage.offsetWidth / 2 + dx;
  const bottom = position.y + stage.offsetHeight + dy;
  return {
    left: centerX - width / 2,
    top: bottom - height,
    right: centerX + width / 2,
    bottom,
  };
}
