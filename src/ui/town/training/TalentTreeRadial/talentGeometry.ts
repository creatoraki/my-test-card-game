// 天赋树径向布局 —— html-templates/天赋树.html 布局算法的数据驱动版。
//
// 输入徽章的分支链与节点, 输出每颗节点的画布坐标、分支折线 path 与末节点标签位置:
// 六条分支绕画布中心等角放射, 链内节点沿方向排布并带交错的轻微锯齿弯曲(与模板一致)。
// 只做几何, 不承载任何解锁/退还/花费规则 —— 那些一律来自 @/data/squadTalents。

import { branchNodesOf, type SquadBadgeDef, type TalentNodeDef } from "@/data";

export const RADIAL_CANVAS = { width: 1280, height: 760 } as const;
// 画布居中对称: 六分支全径向展开, 顶部垂直支的标签仍有余量。
export const RADIAL_CENTER = { x: RADIAL_CANVAS.width / 2, y: RADIAL_CANVAS.height / 2 };

export interface Point {
  x: number;
  y: number;
}

export interface RadialBranchGeometry {
  branchIndex: number;
  /** 链序节点(来自 branchNodesOf)。 */
  nodes: TalentNodeDef[];
  /** 从核心穿过全部节点的折线(连线与流动光点共用)。 */
  pathD: string;
  /** 每颗节点的圆心。 */
  nodePoints: Point[];
  /** 分支名标签位置(末节点沿方向再外推 44px)。 */
  labelPoint: Point;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// 分支长度随节点数微调: 长链拉长, 保证节点间距足够; 短链缩短, 不顶到画布边缘。
function branchLength(nodeCount: number): number {
  return 260 + nodeCount * 16;
}

export function buildRadialLayout(badge: SquadBadgeDef): RadialBranchGeometry[] {
  const branches = badge.branches;
  const n = branches.length;
  const firstProgress = 0.4; // 链首离核心的距离比例

  return branches.map((branch, i) => {
    const nodes = branchNodesOf(badge, branch.id);
    const count = nodes.length;
    const angleDeg = n <= 1 ? -90 : -90 + (360 / n) * i;
    const angle = degToRad(angleDeg);
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    const length = branchLength(count);
    // 相邻分支的锯齿弯曲方向相反, 避免六条链读起来千篇一律。
    const bendDir = i % 2 === 0 ? 1 : -1;
    const bendOffset = 0.06 * length;

    const nodePoints = nodes.map((_, idx) => {
      const t = count <= 1 ? 1 : firstProgress + (1 - firstProgress) * (idx / (count - 1));
      const lateral = bendDir * bendOffset * (idx % 2 === 0 ? 1 : -1);
      return {
        x: RADIAL_CENTER.x + dirX * length * t + perpX * lateral,
        y: RADIAL_CENTER.y + dirY * length * t + perpY * lateral,
      };
    });

    const pathD = [RADIAL_CENTER, ...nodePoints]
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

    const tail = nodePoints[count - 1];
    const labelPoint = { x: tail.x + dirX * 44, y: tail.y + dirY * 44 };

    return { branchIndex: i, nodes, pathD, nodePoints, labelPoint };
  });
}

// 节点半径: major(末节点)大一档; 链内越深越大, 与模板的递进一致。
export function nodeRadius(node: TalentNodeDef, index: number): number {
  if (node.tier === "major") return 22;
  return Math.min(14 + index * 1.8, 19);
}

// 六条分支的表现色(模板六色系: 橙金/棕/蓝/金/紫/绿), 按分支序号查表。
export const RADIAL_BRANCH_HUES: Array<{ hue: string; deep: string }> = [
  { hue: "#ffb347", deep: "#b36b00" },
  { hue: "#c77d5a", deep: "#713f2a" },
  { hue: "#66ccff", deep: "#2266cc" },
  { hue: "#ffcc44", deep: "#cc9900" },
  { hue: "#aa66ff", deep: "#7733cc" },
  { hue: "#55cc66", deep: "#338822" },
];

export function branchHueOf(index: number): { hue: string; deep: string } {
  return RADIAL_BRANCH_HUES[index % RADIAL_BRANCH_HUES.length] ?? RADIAL_BRANCH_HUES[0];
}
