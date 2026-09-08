// 空间站全景(据点)的建筑登记处 —— 轮廓 + 招牌 + 设施绑定, 三件事收在一张表里。
//
// ★ 轮廓是照着 场景/测试/背景素材.png 的原生 1920×1080 逐栋描出来的可见剪影(含附属台阶/设备,
//   不含投影与地面铺装)。它同时也是命中区 —— 建筑之间的空隙点不亮任何光效。
// ★ 坐标系与画布(ui/hooks/stage.ts 的 1920×1080 设计 px)完全一致: SVG viewBox 与招牌锚点
//   直接用它, 任何分辨率下构图逐 px 一致。
// ★ 加一栋建筑 = 这里描一条轮廓 + 在 FACILITY_BINDING 里加一行, 组件一行都不用动。

import {
  ASSEMBLY_BG_ART,
  CRYO_BG_ART,
  MUSEUM_BG_ART,
  SHOP_BG_ART,
  WORKLOG_BG_ART,
} from "@/ui/art/sceneArt";

export const SCENE_WIDTH = 1920;
export const SCENE_HEIGHT = 1080;

const BUILDING_CONTOURS = [
  {
    id: "airlock",
    label: "工房",
    sign: { x: 322, y: 155, anchorX: 380, anchorY: 358 },
    path: `M 359 179
      L 599 125 L 605 119 L 673 140 L 674 79
      Q 679 75 684 80 L 685 145 L 714 153
      L 738 178 Q 744 185 745 198
      L 746 305 L 750 338 L 744 347 L 746 351
      L 708 361 L 715 369 L 705 375 L 696 370
      L 598 401 L 599 406 L 590 410 L 581 405
      L 500 430 L 449 440 L 387 419
      L 373 322 L 370 256 L 361 215 L 360 202
      L 345 203 L 343 190 Z`,
  },
  {
    id: "supplies",
    label: "医疗室",
    sign: { x: 1055, y: 145, anchorX: 995, anchorY: 345 },
    path: `M 773 207
      L 811 198 L 811 193 L 816 191 L 816 183
      L 824 182 L 829 188 L 829 197 L 851 196
      L 852 177 L 860 174 L 889 173 L 894 175
      L 919 172 Q 926 171 928 179 L 930 195
      L 963 193 L 971 197 L 993 221 L 995 229
      L 995 247 L 1006 246 Q 1013 248 1013 255
      L 1012 275 Q 1010 282 1003 282 L 995 278
      L 994 337 L 1005 339 L 1005 347 L 1009 350
      L 1008 367 Q 1002 373 986 370
      L 983 374 L 983 381 L 962 385 L 959 377
      L 834 379 L 831 383 L 815 385 L 808 380
      L 808 375 L 792 377 L 780 373 L 779 368
      L 766 371 L 751 368 L 747 362 L 747 347
      L 752 343 L 768 341 L 772 344 L 774 334
      L 784 329 L 782 303 L 775 304 L 772 309
      L 758 308 L 755 302 L 755 266 L 760 260
      L 773 259 L 776 264 L 777 255 L 771 249
      L 769 219 Q 768 211 773 207 Z`,
  },
  {
    id: "sleeping-pods",
    label: "队员宿舍",
    sign: { x: 1676, y: 150, anchorX: 1610, anchorY: 356 },
    path: `M 1227 174
      L 1240 158 L 1266 154 L 1272 144 L 1290 139
      L 1327 135 L 1337 128 L 1356 124 L 1391 118
      L 1404 115 L 1424 120 L 1436 119
      L 1576 157 L 1594 157 L 1609 160
      Q 1619 163 1625 176 L 1632 189 L 1632 218
      Q 1631 228 1623 235 L 1612 240
      Q 1626 250 1630 264 L 1630 291
      Q 1629 301 1619 307 L 1607 312
      Q 1622 317 1625 331 L 1624 359
      Q 1623 370 1613 377 L 1601 383
      Q 1610 393 1613 408 L 1616 422
      L 1447 471 L 1213 393 L 1215 378 L 1231 372
      L 1223 360 L 1220 350 L 1220 326
      Q 1221 317 1232 309 L 1237 305
      L 1227 295 L 1222 284 L 1223 256
      Q 1225 247 1239 237 L 1231 229 L 1225 218
      L 1224 185 Z`,
  },
  {
    id: "workshop",
    label: "商店",
    sign: { x: 150, y: 473, anchorX: 221, anchorY: 657 },
    path: `M 221 511
      L 326 479 L 326 469 L 350 460 L 370 465
      L 376 472 L 391 467 Q 397 465 404 469
      L 457 489 L 463 489 L 477 500 L 477 521
      L 471 526 L 472 540 L 492 542 L 504 550
      L 508 599 L 516 602 L 526 619 L 526 629
      L 536 628 L 541 636 L 541 654 L 534 658
      L 527 656 L 520 660 L 520 673 L 525 676
      L 505 684 L 490 679 L 489 671 L 494 668
      L 494 658 L 332 711 L 324 710 L 322 717
      Q 313 721 303 715 L 300 708 L 287 709
      L 283 699 Q 270 704 256 695 L 255 687
      L 242 684 L 225 675 L 216 672 L 212 660
      L 205 657 L 202 638 L 199 635 L 199 586
      L 194 585 L 190 576 L 190 554 L 200 551
      L 202 538 Q 200 524 210 517 Z`,
  },
  {
    id: "power-station",
    label: "档案机",
    sign: { x: 957, y: 625, anchorX: 890, anchorY: 828 },
    path: `M 646 801
      L 665 796 L 688 803 L 701 799 L 703 768
      L 709 760 L 718 738 L 739 733 L 780 740
      L 785 718 L 793 708 L 832 707 L 853 711
      L 888 710 L 898 718 L 896 759 L 891 770
      L 896 774 L 897 801 L 891 827 L 889 860
      L 881 869 L 715 857 L 647 848 L 644 807 Z`,
  },
  {
    id: "laboratory",
    label: "研究中心",
    sign: { x: 1788, y: 490, anchorX: 1698, anchorY: 691 },
    path: `M 1076 673
      L 1197 641 L 1409 588 L 1412 565
      Q 1413 554 1423 548 L 1477 530 L 1491 531
      L 1511 537 L 1525 529 L 1551 521 L 1555 512
      L 1567 503 L 1584 501 L 1632 513 L 1640 510
      L 1657 515 L 1674 511 L 1676 498 L 1684 485
      L 1690 490 L 1697 505 L 1703 513 L 1704 524
      L 1698 533 L 1719 535 L 1727 539 L 1736 560
      L 1730 617 L 1727 653 L 1705 679 L 1692 692
      L 1666 707 L 1654 708 L 1650 714 L 1628 724
      L 1625 730 L 1602 739 L 1593 741 L 1583 737
      L 1497 769 L 1496 780 L 1490 787
      L 1140 871 L 1124 867 L 1088 828
      L 1088 862 L 1063 868 L 1052 857 L 1051 842
      L 1040 831 L 1040 821 L 1035 815 L 1034 799
      L 1042 794 L 1069 791 L 1072 688 Z`,
  },
] as const;

export type BuildingId = (typeof BUILDING_CONTOURS)[number]["id"];

/** 一栋建筑进去之后的目标: 设施 id 或顶层 screen id + 背景图。
 *  ⚠ 曾经还有 focus / scale(推镜焦点与放大倍数): 进设施的运镜已整套删除, 两个字段一并去掉。 */
export interface FacilityBinding {
  /** 设施 id 与 TownScreen 的 FACILITY_CONTENT 键一致, 顶层场景直接填写 screen id。 */
  facility: string;
  /** 设施自己的背景图(16:9, 与画布同比例 ⇒ cover 只等比缩放, 无裁切无变形)。 */
  bg: string;
}

// ★ 换设施背景就改这里, 别去动组件或 CSS。
const FACILITY_BINDING: Record<BuildingId, FacilityBinding> = {
  // 工房: 模组装配 / 制造 / 装备升阶 / 羁绊重铸
  airlock: { facility: "assembly", bg: ASSEMBLY_BG_ART },
  // 医疗室: 冬眠唤醒 / 营养舱
  supplies: { facility: "cryo", bg: CRYO_BG_ART },
  // 队员宿舍: 进入顶层编队场景, 沿用冬眠仓背景作为像素转场目标
  "sleeping-pods": { facility: "formation", bg: CRYO_BG_ART },
  // 商店: 货架 / 仓库 / 回收台 / 库存清单
  workshop: { facility: "shop", bg: SHOP_BG_ART },
  // 档案机: 物品 / 卡牌 / 怪物图鉴
  "power-station": { facility: "museum", bg: MUSEUM_BG_ART },
  // 研究中心: 委托终端
  laboratory: { facility: "worklog", bg: WORKLOG_BG_ART },
};

export interface StationBuilding extends FacilityBinding {
  id: BuildingId;
  /** 招牌与命中区的中文名, 也是 aria-label 的来源。 */
  label: string;
  /** 竖排招牌的挂点与引线锚点(设计 px)。 */
  sign: { x: number; y: number; anchorX: number; anchorY: number };
  /** 建筑剪影, 同时是命中区。 */
  path: string;
}

/** 场景里从左到右、从上到下的建筑表。数组顺序同时决定进设施演出里 HUD 的飞出次序。 */
export const STATION_BUILDINGS: StationBuilding[] = BUILDING_CONTOURS.map((contour) => ({
  ...contour,
  ...FACILITY_BINDING[contour.id],
}));

const BY_FACILITY = new Map(STATION_BUILDINGS.map((building) => [building.facility, building]));

/** 设施 id → 建筑。未登记的设施点了不会有演出。 */
export const buildingOfFacility = (facility: string): StationBuilding | undefined =>
  BY_FACILITY.get(facility);
