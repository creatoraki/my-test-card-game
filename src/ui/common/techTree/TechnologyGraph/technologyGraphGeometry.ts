import type { TechnologyCore, TechnologyNode } from "@/ui/common/techTree/TechnologyTree/types";

/** 水平分支使用圆角正交连线；节点与端点共享坐标，滚动时不会错位。 */
export function technologyGraphEdges(nodes: TechnologyNode[], core: TechnologyCore) {
  const points = new Map(nodes.map((node) => [node.id, node]));
  return nodes.flatMap((node) => (node.requires.length ? node.requires : [null]).map((parentId) => {
    const parent = parentId ? points.get(parentId) : core;
    if (!parent) return [];
    const start = { x: parent.x + 80, y: parent.y };
    const end = { x: node.x - 80, y: node.y };
    const middle = (start.x + end.x) / 2;
    const direction = Math.sign(end.y - start.y);
    const radius = Math.min(38, Math.abs(end.y - start.y) / 2, Math.abs(end.x - start.x) / 2);
    const path = direction === 0
      ? `M${start.x} ${start.y}H${end.x}`
      : `M${start.x} ${start.y}H${middle - radius}Q${middle} ${start.y} ${middle} ${start.y + radius * direction}V${end.y - radius * direction}Q${middle} ${end.y} ${middle + radius} ${end.y}H${end.x}`;
    return [{ id: `${parentId ?? "core"}-${node.id}`, path, start, end, lit: node.state !== "locked" }];
  }).flat());
}
