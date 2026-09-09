export interface Point {
  x: number;
  y: number;
}

export interface TechTreeNodeLike {
  id: string;
  x: number;
  y: number;
  requires: string[];
}

export interface TechTreeEdge {
  id: string;
  from: Point;
  to: Point;
  targetId: string;
}

/** 根据节点前置关系生成核心到节点、节点到节点的直线连边。 */
export function techTreeEdges(nodes: TechTreeNodeLike[], core: Point): TechTreeEdge[] {
  const points = new Map(nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
  return nodes.flatMap((node) => {
    const dependencies = node.requires.length ? node.requires : [null];
    return dependencies.map((dependency) => ({
      id: `${dependency ?? "core"}-${node.id}`,
      from: dependency ? points.get(dependency) ?? core : core,
      to: { x: node.x, y: node.y },
      targetId: node.id,
    }));
  });
}
