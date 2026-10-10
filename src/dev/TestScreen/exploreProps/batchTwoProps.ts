import tripodCauldron from "@/assets/test-screen/交互物第二批/三足青鼎.webp";
import thornRoseCase from "@/assets/test-screen/交互物第二批/荆棘玫瑰匣.webp";
import coinToad from "@/assets/test-screen/交互物第二批/衔币金蟾.webp";
import pathSunflower from "@/assets/test-screen/交互物第二批/窥路葵.webp";
import glassKaleidoscope from "@/assets/test-screen/交互物第二批/琉璃万花筒.webp";
import waxHive from "@/assets/test-screen/交互物第二批/蜜蜡蜂巢.webp";
import hermitCrabPeddler from "@/assets/test-screen/交互物第二批/寄居蟹货郎.webp";
import postmanPelican from "@/assets/test-screen/交互物第二批/邮差鹈鹕.webp";
import eelTank from "@/assets/test-screen/交互物第二批/雷鳗水缸.webp";
import hornVine from "@/assets/test-screen/交互物第二批/铜喇叭藤.webp";
import graftedTree from "@/assets/test-screen/交互物第二批/嫁接百果树.webp";
import pitcherOriginal from "@/assets/test-screen/交互物第二批/巨口猪笼草原版.webp";
import armoredScarecrow from "@/assets/test-screen/交互物第二批/披甲稻草人.webp";
import gourdVine from "@/assets/test-screen/交互物第二批/悬壶药藤.webp";
import fallenBasket from "@/assets/test-screen/交互物第二批/坠落气球篮.webp";
import pitcherRedraw from "@/assets/test-screen/交互物第二批/巨口猪笼草补位版.webp";
import type { CorridorPropArt } from "@/ui/art/corridor/corridorArt";
import { sizeCorridorProp } from "@/ui/art/corridor/corridorPropSizing";

/**
 * 交互物重设计第二批（docs/交互物美术重设计-第二批-出图批次.md）的待确认素材，暂存在 assets/test-screen/交互物第二批/。
 * 用户确认后改为放进 通用交互物/ 并登记到 commonPropAssets.ts，届时删除本文件与暂存目录。
 * 每组一行，顺序同四宫格：左上、右上、左下、右下；巨口猪笼草有第三组原版与第四组补位版两张。
 */
export interface BatchTwoProp {
  id: string;
  name: string;
  art: CorridorPropArt;
}

export const BATCH_TWO_GROUPS: readonly (readonly BatchTwoProp[])[] = [
  [
    { id: "batch2-tripod-cauldron", name: "三足青鼎", art: sizeCorridorProp(tripodCauldron, { width: 460, height: 438, top: 3, bottom: 435 }, "medium") },
    { id: "batch2-thorn-rose-case", name: "荆棘玫瑰匣", art: sizeCorridorProp(thornRoseCase, { width: 425, height: 447, top: 4, bottom: 445 }, "medium") },
    { id: "batch2-coin-toad", name: "衔币金蟾", art: sizeCorridorProp(coinToad, { width: 473, height: 397, top: 3, bottom: 394 }, "medium") },
    { id: "batch2-path-sunflower", name: "窥路葵", art: sizeCorridorProp(pathSunflower, { width: 429, height: 433, top: 3, bottom: 430 }, "medium") },
  ],
  [
    { id: "batch2-glass-kaleidoscope", name: "琉璃万花筒", art: sizeCorridorProp(glassKaleidoscope, { width: 481, height: 439, top: 3, bottom: 434 }, "medium") },
    { id: "batch2-wax-hive", name: "蜜蜡蜂巢", art: sizeCorridorProp(waxHive, { width: 486, height: 458, top: 3, bottom: 453 }, "medium") },
    { id: "batch2-hermit-crab-peddler", name: "寄居蟹货郎", art: sizeCorridorProp(hermitCrabPeddler, { width: 539, height: 455, top: 3, bottom: 452 }, "medium") },
    { id: "batch2-postman-pelican", name: "邮差鹈鹕", art: sizeCorridorProp(postmanPelican, { width: 445, height: 474, top: 2, bottom: 471 }, "medium") },
  ],
  [
    { id: "batch2-eel-tank", name: "雷鳗水缸", art: sizeCorridorProp(eelTank, { width: 464, height: 431, top: 3, bottom: 428 }, "medium") },
    { id: "batch2-horn-vine", name: "铜喇叭藤", art: sizeCorridorProp(hornVine, { width: 430, height: 411, top: 3, bottom: 409 }, "medium") },
    { id: "batch2-grafted-tree", name: "嫁接百果树", art: sizeCorridorProp(graftedTree, { width: 487, height: 470, top: 3, bottom: 467 }, "large") },
    { id: "batch2-pitcher-original", name: "巨口猪笼草·原版", art: sizeCorridorProp(pitcherOriginal, { width: 474, height: 472, top: 3, bottom: 470 }, "medium") },
  ],
  [
    { id: "batch2-armored-scarecrow", name: "披甲稻草人", art: sizeCorridorProp(armoredScarecrow, { width: 448, height: 444, top: 3, bottom: 441 }, "medium") },
    { id: "batch2-gourd-vine", name: "悬壶药藤", art: sizeCorridorProp(gourdVine, { width: 448, height: 438, top: 3, bottom: 434 }, "medium") },
    { id: "batch2-fallen-basket", name: "坠落气球篮", art: sizeCorridorProp(fallenBasket, { width: 461, height: 430, top: 3, bottom: 427 }, "large") },
    { id: "batch2-pitcher-redraw", name: "巨口猪笼草·补位版", art: sizeCorridorProp(pitcherRedraw, { width: 457, height: 431, top: 3, bottom: 427 }, "medium") },
  ],
];
