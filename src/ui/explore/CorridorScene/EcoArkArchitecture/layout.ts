import { ECO_ARK_ARCHITECTURE_ART, type EcoArkArchitectureArt } from "@/ui/art/ecoArkArchitectureArt";

export interface EcoArkArchitecturePlacement {
  id: string;
  art: EcoArkArchitectureArt;
  x: number;
  height: number;
  offsetY: number;
  mirrored: boolean;
  opacity: number;
}

function seededRandom(seedText: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seedText.length; index += 1) {
    state = Math.imul(state ^ seedText.charCodeAt(index), 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** 以房间编号固定随机序列，回访时保持建筑位置与种类不变。 */
export function buildEcoArkArchitectureLayout(
  roomId: string,
  roomWidth: number,
  occupiedX: readonly number[],
): EcoArkArchitecturePlacement[] {
  const random = seededRandom(roomId);
  const edgePadding = 430;
  const usableWidth = Math.max(0, roomWidth - edgePadding * 2);
  const segmentCount = 18;
  const candidates = Array.from({ length: segmentCount }, (_, index) => (
    edgePadding + usableWidth * (index + 0.2 + random() * 0.6) / segmentCount
  ));

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [candidates[index], candidates[other]] = [candidates[other], candidates[index]];
  }

  const targetCount = 2 + Math.floor(random() * 2);
  const placements: EcoArkArchitecturePlacement[] = [];

  for (const x of candidates) {
    if (placements.length >= targetCount) break;
    const art = ECO_ARK_ARCHITECTURE_ART[Math.floor(random() * ECO_ARK_ARCHITECTURE_ART.length)];
    if (placements.some((placement) => placement.art.id === art.id)) continue;

    const scale = 0.84 + random() * 0.24;
    const height = Math.round(art.displayHeight * scale);
    const renderedWidth = height * art.aspectRatio;
    if (x - renderedWidth / 2 < 80 || x + renderedWidth / 2 > roomWidth - 80) continue;
    if (occupiedX.some((occupied) => Math.abs(occupied - x) < Math.max(260, renderedWidth / 2 + 180))) continue;
    if (placements.some((placement) => {
      const otherWidth = placement.height * placement.art.aspectRatio;
      return Math.abs(placement.x - x) < (otherWidth + renderedWidth) / 2 + 140;
    })) continue;

    placements.push({
      id: `${roomId}-architecture-${placements.length}`,
      art,
      x: Math.round(x),
      height,
      offsetY: Math.round(random() * 14),
      mirrored: random() > 0.5,
      opacity: 0.78 + random() * 0.13,
    });
  }

  return placements.sort((left, right) => left.x - right.x);
}
