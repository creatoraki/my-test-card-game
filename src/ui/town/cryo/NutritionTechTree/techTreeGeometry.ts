import { NUTRITION_TECH_CANVAS, NUTRITION_TECHS, type NutritionTech } from "@/data";
import { techTreeEdges, type TechTreeEdge, type Point } from "@/ui/common/techTree/techTreeEdges";

export type NutritionTechEdge = TechTreeEdge;

export const NUTRITION_TECH_CORE: Point = { x: 80, y: NUTRITION_TECH_CANVAS.height / 2 };
export const NUTRITION_TECH_NODE_RADIUS = 34;
export const NUTRITION_TECH_HIT_RADIUS = 50;

export function nutritionTechEdges(techs: NutritionTech[] = NUTRITION_TECHS): NutritionTechEdge[] {
  return techTreeEdges(techs, NUTRITION_TECH_CORE);
}
