export const MECHANICAL_CRITTER_FOODS = {
  beetle: ["bread", "milk"],
  mole: ["hamburger", "fried-chicken"],
  cleaner: ["cola", "pizza"],
} as const;

export type MechanicalCritterId = keyof typeof MECHANICAL_CRITTER_FOODS;

export function critterFoods(id: MechanicalCritterId): readonly string[] {
  return MECHANICAL_CRITTER_FOODS[id];
}
