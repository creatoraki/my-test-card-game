import greenhouse from "@/assets/explore-corridor/生态方舟/近景建筑/生态温室.png";
import seedArchive from "@/assets/explore-corridor/生态方舟/近景建筑/种源保存馆.png";
import researchHall from "@/assets/explore-corridor/生态方舟/近景建筑/水培研究馆.png";
import waterStation from "@/assets/explore-corridor/生态方舟/近景建筑/水循环处理站.png";
import observatory from "@/assets/explore-corridor/生态方舟/近景建筑/冠层观测塔.png";
import restorationCenter from "@/assets/explore-corridor/生态方舟/近景建筑/生态修复中心.png";

export interface EcoArkArchitectureArt {
  id: string;
  src: string;
  aspectRatio: number;
  displayHeight: number;
  groundTrim: number;
}

/** 方舟走廊的完整正视建筑立面；尺寸为场景设计像素。 */
export const ECO_ARK_ARCHITECTURE_ART: readonly EcoArkArchitectureArt[] = [
  { id: "greenhouse", src: greenhouse, aspectRatio: 1983 / 793, displayHeight: 320, groundTrim: 0 },
  { id: "seed-archive", src: seedArchive, aspectRatio: 1199 / 1312, displayHeight: 420, groundTrim: 0 },
  { id: "research-hall", src: researchHall, aspectRatio: 2172 / 724, displayHeight: 300, groundTrim: 0 },
  { id: "water-station", src: waterStation, aspectRatio: 1774 / 887, displayHeight: 320, groundTrim: 0 },
  { id: "observatory", src: observatory, aspectRatio: 1024 / 1536, displayHeight: 500, groundTrim: 0 },
  { id: "restoration-center", src: restorationCenter, aspectRatio: 1774 / 887, displayHeight: 320, groundTrim: 0 },
];

export const ECO_ARK_ARCHITECTURE_SOURCES = ECO_ARK_ARCHITECTURE_ART.map(({ src }) => src);
