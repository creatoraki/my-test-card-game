import pillar from "@/assets/explore-corridor/生态方舟/近景建筑/温室支撑柱.png";
import planter from "@/assets/explore-corridor/生态方舟/近景建筑/水培苗床.png";
import arch from "@/assets/explore-corridor/生态方舟/近景建筑/藤蔓拱廊.png";
import beacon from "@/assets/explore-corridor/生态方舟/近景建筑/生态信标灯.png";

export interface EcoArkArchitectureArt {
  id: string;
  src: string;
  aspectRatio: number;
  displayHeight: number;
  groundTrim: number;
}

/** 方舟走廊使用的透明建筑装饰；尺寸为场景设计像素。 */
export const ECO_ARK_ARCHITECTURE_ART: readonly EcoArkArchitectureArt[] = [
  { id: "pillar", src: pillar, aspectRatio: 1024 / 1536, displayHeight: 430, groundTrim: 0 },
  { id: "planter", src: planter, aspectRatio: 1448 / 1086, displayHeight: 330, groundTrim: 40 / 1086 },
  { id: "arch", src: arch, aspectRatio: 1254 / 1254, displayHeight: 500, groundTrim: 0 },
  { id: "beacon", src: beacon, aspectRatio: 1024 / 1536, displayHeight: 370, groundTrim: 0 },
];

export const ECO_ARK_ARCHITECTURE_SOURCES = ECO_ARK_ARCHITECTURE_ART.map(({ src }) => src);
