import { ECO_ARK_ARCHITECTURE_ART, type EcoArkArchitectureArt } from "@/ui/art/ecoArkArchitectureArt";

export interface EcoArkArchitecturePlacement {
  id: string;
  art: EcoArkArchitectureArt;
  x: number;
  height: number;
  mirrored: boolean;
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
  const edgePadding = 230;
  const usableWidth = Math.max(0, roomWidth - edgePadding * 2);
  const segmentCount = 24;
  const candidates = Array.from({ length: segmentCount }, (_, index) => (
    edgePadding + usableWidth * (index + 0.2 + random() * 0.6) / segmentCount
  ));

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [candidates[index], candidates[other]] = [candidates[other], candidates[index]];
  }

  const targetCount = 4 + Math.floor(random() * 2);
  const attempts = candidates.map((x) => {
    const art = ECO_ARK_ARCHITECTURE_ART[Math.floor(random() * ECO_ARK_ARCHITECTURE_ART.length)];
    const scale = 1.02 + random() * 0.12;
    const height = Math.round(art.displayHeight * scale);
    return { x, art, height, renderedWidth: height * art.aspectRatio, mirrored: random() > 0.5 };
  });
  const placements: EcoArkArchitecturePlacement[] = [];

  // 优先让建筑中心避开交互物与传送门；建筑图层位于实体后方，必要时仍可补足数量。
  for (const respectOccupied of [true, false]) {
    for (const attempt of attempts) {
      if (placements.length >= targetCount) break;
      if (placements.some((placement) => placement.art.id === attempt.art.id)) continue;
      if (attempt.x - attempt.renderedWidth / 2 < 40 || attempt.x + attempt.renderedWidth / 2 > roomWidth - 40) continue;
      if (respectOccupied && occupiedX.some((occupied) => Math.abs(occupied - attempt.x) < 190)) continue;

      placements.push({
        id: `${roomId}-architecture-${placements.length}`,
        art: attempt.art,
        x: Math.round(attempt.x),
        height: attempt.height,
        mirrored: attempt.mirrored,
      });
    }
  }

  // 均匀分散的备用点使用可完整落入房间的素材，保证每间房至少出现四座。
  if (placements.length < 4) {
    for (let index = 0; index < targetCount; index += 1) {
      if (placements.length >= targetCount) break;
      const x = roomWidth * (0.12 + 0.76 * index / Math.max(1, targetCount - 1));
      const fittingArt = ECO_ARK_ARCHITECTURE_ART.map((art) => {
        const scale = 1.02 + random() * 0.12;
        const height = Math.round(art.displayHeight * scale);
        return { art, height, renderedWidth: height * art.aspectRatio, mirrored: random() > 0.5 };
      }).filter((candidate) => (
        x - candidate.renderedWidth / 2 >= 40
        && x + candidate.renderedWidth / 2 <= roomWidth - 40
      ));
      const unusedArt = fittingArt.filter((candidate) => (
        !placements.some((placement) => placement.art.id === candidate.art.id)
      ));
      const choices = unusedArt.length ? unusedArt : fittingArt;
      const choice = choices[Math.floor(random() * choices.length)];
      if (!choice) continue;

      placements.push({
        id: `${roomId}-architecture-${placements.length}`,
        art: choice.art,
        x: Math.round(x),
        height: choice.height,
        mirrored: choice.mirrored,
      });
    }
  }

  // 不按建筑宽度互相排斥；较大的立面可以在视觉上部分遮挡相邻建筑。
  return placements.sort((left, right) => left.x - right.x);
}
