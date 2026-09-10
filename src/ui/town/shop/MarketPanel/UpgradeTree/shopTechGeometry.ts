import { SHOP_TECH_CANVAS, SHOP_TECHS, type ShopTech } from "@/data";
import { techTreeEdges, type TechTreeEdge, type Point } from "@/ui/common/techTree/techTreeEdges";

export const SHOP_TECH_CORE: Point = { x: 80, y: SHOP_TECH_CANVAS.height / 2 };
export const SHOP_TECH_NODE_RADIUS = 34;
export const SHOP_TECH_HIT_RADIUS = 50;

export function shopTechEdges(techs: ShopTech[] = SHOP_TECHS): TechTreeEdge[] {
  return techTreeEdges(techs, SHOP_TECH_CORE);
}
