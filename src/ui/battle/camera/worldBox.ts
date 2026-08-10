import type { EnemyPlacement } from "@/data";

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function layoutPosition(world: HTMLElement, element: HTMLElement): { x: number; y: number } {
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

export function unitWorldBox(world: HTMLElement, id: string, placement?: EnemyPlacement): Box | null {
  const combatant = world.querySelector<HTMLElement>(`[data-cmb-id="${id}"]`);
  if (!combatant) return null;
  const stage = combatant.querySelector<HTMLElement>("[data-cmb-stage]") ?? combatant;
  const position = layoutPosition(world, stage);
  const scale = placement?.scale ?? 1;
  const width = stage.offsetWidth * scale;
  const height = stage.offsetHeight * scale;
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
