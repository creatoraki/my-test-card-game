// 原型坐标系：1672×941；由天赋页外壳统一映射到 1920×1080 设计画布。
// 分支按资源语义固定位置，节点数量仍取实际徽章配置。
import { branchNodesOf, type SquadBadgeDef, type TalentNodeDef } from "@/data";

export const RADIAL_CANVAS = { width: 1672, height: 941 } as const;
export const RADIAL_CENTER = { x: 836, y: 425 };
export interface Point { x: number; y: number }
interface BranchArtwork {
  hue: string;
  deep: string;
  label: Point;
  points: Point[];
}
const points = (...pairs: [number, number][]): Point[] => pairs.map(([x, y]) => ({ x, y }));
export const BRANCH_ART: Record<string, BranchArtwork> = {
  handLimit: { hue: "#ffc76b", deep: "#8a501b", label: { x: 836, y: 61 },
    points: points([836, 289], [836, 220], [836, 137]) },
  redraw: { hue: "#ff7c88", deep: "#832a3c", label: { x: 836, y: 699 },
    points: points([836, 533], [836, 581], [836, 633]) },
  wait: { hue: "#6bccff", deep: "#155492", label: { x: 1413, y: 425 },
    points: points([976, 454], [1042, 462], [1107, 447], [1172, 435], [1238, 422]) },
  mana: { hue: "#b0ef91", deep: "#386627", label: { x: 257, y: 425 },
    points: points([696, 454], [630, 462], [565, 447], [500, 435], [434, 422]) },
  draw: { hue: "#cd91ff", deep: "#582989", label: { x: 1167, y: 169 },
    points: points([934, 332], [993, 296], [1066, 238]) },
  openingHand: { hue: "#74e4ff", deep: "#12618b", label: { x: 507, y: 169 },
    points: points([738, 332], [678, 296], [605, 238]) },
};
export function branchArtOf(id: string): BranchArtwork {
  return BRANCH_ART[id] ?? BRANCH_ART.handLimit;
}
export interface RadialBranchGeometry {
  branchIndex: number;
  nodes: TalentNodeDef[];
  pathD: string;
  nodePoints: Point[];
  labelPoint: Point;
}
export function buildRadialLayout(badge: SquadBadgeDef): RadialBranchGeometry[] {
  return badge.branches.map((branch, branchIndex) => {
    const nodes = branchNodesOf(badge, branch.id);
    const art = branchArtOf(branch.id);
    const nodePoints = nodes.map((_, index) => {
      if (nodes.length === art.points.length) return art.points[index];
      const progress = nodes.length <= 1 ? Math.floor((art.points.length - 1) / 2) : index * (art.points.length - 1) / (nodes.length - 1);
      const a = art.points[Math.floor(progress)];
      const b = art.points[Math.min(Math.ceil(progress), art.points.length - 1)];
      const t = progress % 1;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    });
    return {
      branchIndex, nodes, nodePoints, labelPoint: art.label,
      pathD: [RADIAL_CENTER, ...nodePoints].map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" "),
    };
  });
}
export function nodeRadius(node: TalentNodeDef, index: number): number {
  if (node.key === "redraws") return node.tier === "major" ? 29 : 20;
  if (node.tier === "major") return 32;
  return Math.min(23 + index * 1.5, 28);
}
