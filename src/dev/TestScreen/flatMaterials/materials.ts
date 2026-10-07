import seed from "../../../../处理后的WebP素材/已确认/月露种子舱_平面版.webp";
import chest from "../../../../处理后的WebP素材/已确认/潮汐机械宝匣_平面版.webp";
import furnace from "../../../../处理后的WebP素材/已确认/琉璃炼金炉_平面版.webp";
import terminal from "@/assets/explore-corridor/公共交互物/羽翼信使.webp";
import herbBag from "../../../../处理后的WebP素材/已确认/草药旅行布袋.webp";

/** 高度为可见主体高度，透明画布留白不计入尺寸。 */
export const FLAT_MATERIALS = [
  { name: "月露种子舱", src: seed, x: 500, height: 320 },
  { name: "潮汐机械宝匣", src: chest, x: 925, height: 210 },
  { name: "琉璃炼金炉", src: furnace, x: 1350, height: 320 },
  { name: "羽翼信使终端（平面版）", src: terminal, x: 1775, height: 300 },
  { name: "草药旅行布袋", src: herbBag, x: 2625, height: 180 },
] as const;
