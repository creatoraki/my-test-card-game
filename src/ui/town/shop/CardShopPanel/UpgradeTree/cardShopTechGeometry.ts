import { CARD_SHOP_TECH_CANVAS, CARD_SHOP_TECHS, type CardShopTech } from "@/data";
import { techTreeEdges, type TechTreeEdge, type Point } from "@/ui/common/techTree/techTreeEdges";

export const CARD_SHOP_TECH_CORE: Point = { x: 80, y: CARD_SHOP_TECH_CANVAS.height / 2 };
export const CARD_SHOP_TECH_NODE_RADIUS = 34;
export const CARD_SHOP_TECH_HIT_RADIUS = 50;

export function cardShopTechEdges(techs: CardShopTech[] = CARD_SHOP_TECHS): TechTreeEdge[] {
  return techTreeEdges(techs, CARD_SHOP_TECH_CORE);
}
