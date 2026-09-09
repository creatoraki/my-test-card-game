import { TECH_NODES, TECH_TREE_CANVAS, type TechNodeDef } from "@/data";
import {
  techTreeEdges as makeTechTreeEdges,
  type Point,
  type TechTreeEdge,
} from "@/ui/common/techTree/techTreeEdges";

export const TECH_TREE_CORE: Point = { x: 90, y: TECH_TREE_CANVAS.height / 2 };
export const TECH_TREE_NODE_RADIUS = 36;
export const TECH_TREE_LEVEL_RADIUS = 47;
export const TECH_TREE_HIT_RADIUS = 58;

export function techTreeEdges(
  categoryId: string,
  nodes: TechNodeDef[] = TECH_NODES,
): TechTreeEdge[] {
  return makeTechTreeEdges(
    nodes.filter((node) => node.categoryId === categoryId),
    TECH_TREE_CORE,
  );
}
