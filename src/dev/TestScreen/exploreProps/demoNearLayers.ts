import art43 from "@/assets/test-screen/近景演示/生态方舟_近景_4-3.webp";
import art61 from "@/assets/test-screen/近景演示/生态方舟_近景_6-1.webp";
import art62 from "@/assets/test-screen/近景演示/生态方舟_近景_6-2.webp";
import art63 from "@/assets/test-screen/近景演示/生态方舟_近景_6-3.webp";
import art64 from "@/assets/test-screen/近景演示/生态方舟_近景_6-4.webp";

/** 可切换的演示近景图层；高度同为 1024、路面上沿 954、下缘 974，宽度各异，各按自身宽度横向平铺。 */
export interface DemoNearArt {
  id: string;
  name: string;
  src: string;
  /** 原图宽度（像素）。 */
  width: number;
}

export const DEMO_NEAR_LAYERS: readonly DemoNearArt[] = [
  { id: "4-3", name: "生态方舟 4-3", src: art43, width: 3072 },
  { id: "6-1", name: "生态方舟 6-1", src: art61, width: 3032 },
  { id: "6-2", name: "生态方舟 6-2", src: art62, width: 3072 },
  { id: "6-3", name: "生态方舟 6-3", src: art63, width: 3072 },
  { id: "6-4", name: "生态方舟 6-4", src: art64, width: 3006 },
];

export const DEFAULT_NEAR_LAYER_ID = DEMO_NEAR_LAYERS[0].id;

export const findNearLayer = (id: string) => DEMO_NEAR_LAYERS.find((layer) => layer.id === id) ?? DEMO_NEAR_LAYERS[0];
