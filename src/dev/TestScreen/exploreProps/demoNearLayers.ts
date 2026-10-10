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
  { id: "neon-street-1", name: "霓虹街区模板1", src: NEON_CITY_NEAR_ART.neonCity1, width: NEON_CITY_NEAR_SOURCE_GEOMETRY.neonCity1.width },
  { id: "neon-street-2", name: "霓虹街区模板2", src: NEON_CITY_NEAR_ART.neonCity2, width: NEON_CITY_NEAR_SOURCE_GEOMETRY.neonCity2.width },
  { id: "neon-street-3", name: "霓虹街区模板3", src: NEON_CITY_NEAR_ART.neonCity3, width: NEON_CITY_NEAR_SOURCE_GEOMETRY.neonCity3.width },
  { id: "neon-street-4", name: "霓虹街区模板4", src: NEON_CITY_NEAR_ART.neonCity4, width: NEON_CITY_NEAR_SOURCE_GEOMETRY.neonCity4.width },
];

export const DEFAULT_NEAR_LAYER_ID = DEMO_NEAR_LAYERS[0].id;

export const findNearLayer = (id: string) => DEMO_NEAR_LAYERS.find((layer) => layer.id === id) ?? DEMO_NEAR_LAYERS[0];
