import { NEON_CITY_NEAR_ART } from "@/ui/art/corridor/neonCityNearArt";
import { NEON_CITY_NEAR_SOURCE_GEOMETRY } from "@/explore/dungeon/neonCityNearGeometry";

export { NEON_CITY_NEAR_SOURCE as DEMO_NEAR_SOURCE } from "@/explore/dungeon/neonCityNearGeometry";

/** 可切换的演示近景图层；高度同为 1024、路面上沿 954、下缘 974，宽度各异，各按自身宽度横向平铺。 */
export interface DemoNearArt {
  id: string;
  name: string;
  src: string;
  /** 原图宽度（像素）。 */
  width: number;
}

export const DEMO_NEAR_LAYERS: readonly DemoNearArt[] = [
  ...Object.entries(NEON_CITY_NEAR_ART).map(([variant, src], index) => ({
    id: `neon-street-${index + 1}`,
    name: `霓虹街区模板${index + 1}`,
    src,
    width: NEON_CITY_NEAR_SOURCE_GEOMETRY[variant as keyof typeof NEON_CITY_NEAR_SOURCE_GEOMETRY].width,
  })),
];

export const DEFAULT_NEAR_LAYER_ID = DEMO_NEAR_LAYERS[0].id;

export const findNearLayer = (id: string) => DEMO_NEAR_LAYERS.find((layer) => layer.id === id) ?? DEMO_NEAR_LAYERS[0];
