import { NUTRITION_TECH_CANVAS, NUTRITION_TECHS, type NutritionTech } from "@/data";

export interface Point {
  x: number;
  y: number;
}

export interface NutritionTechEdge {
  id: string;
  from: Point;
  to: Point;
  targetId: string;
}

export const NUTRITION_TECH_CORE: Point = { x: 80, y: NUTRITION_TECH_CANVAS.height / 2 };
export const NUTRITION_TECH_NODE_RADIUS = 34;
export const NUTRITION_TECH_HIT_RADIUS = 50;

export function nutritionTechEdges(techs: NutritionTech[] = NUTRITION_TECHS): NutritionTechEdge[] {
  const points = new Map(techs.map((tech) => [tech.id, { x: tech.x, y: tech.y }]));
  return techs.flatMap((tech) => {
    const dependencies = tech.requires.length ? tech.requires : [null];
    return dependencies.map((dependency) => ({
      id: `${dependency ?? "core"}-${tech.id}`,
      from: dependency ? points.get(dependency) ?? NUTRITION_TECH_CORE : NUTRITION_TECH_CORE,
      to: { x: tech.x, y: tech.y },
      targetId: tech.id,
    }));
  });
}
