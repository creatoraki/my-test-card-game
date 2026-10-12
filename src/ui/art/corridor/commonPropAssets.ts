import moonBasin from "@/assets/explore-corridor/通用交互物/月光能量盆.webp";
import soundBellRack from "@/assets/explore-corridor/通用交互物/声波铃鼓架.webp";
import sealPillar from "@/assets/explore-corridor/通用交互物/封印能量柱.webp";
import whaleGramophone from "@/assets/explore-corridor/通用交互物/鲸纹留声机.webp";
import stoneShrine from "@/assets/explore-corridor/通用交互物/神龛.webp";
import dreamLoom from "@/assets/explore-corridor/通用交互物/紫晶织梦机.webp";
import wingCourier from "@/assets/explore-corridor/通用交互物/羽翼信使.webp";
import mossMailbox from "@/assets/explore-corridor/通用交互物/苔铃邮筒.webp";
import robotMerchant from "@/assets/explore-corridor/通用交互物/货商.webp";
import oakSignpost from "@/assets/explore-corridor/通用交互物/橡叶岔路牌.webp";
import sleepCatVault from "@/assets/explore-corridor/通用交互物/眠猫金库.webp";
import rustSnailShell from "@/assets/explore-corridor/通用交互物/锈蜗储物壳.webp";
import starSandHourglass from "@/assets/explore-corridor/通用交互物/星砂沙漏.webp";
import triPetalLotus from "@/assets/explore-corridor/通用交互物/三瓣熔莲.webp";
import miasmaTapir from "@/assets/explore-corridor/通用交互物/食秽貘龛.webp";
import reverseSakuraSpring from "@/assets/explore-corridor/通用交互物/逆流樱泉.webp";
import stoppedCuckooClock from "@/assets/explore-corridor/通用交互物/停摆布谷钟.webp";
import bottledTown from "@/assets/explore-corridor/通用交互物/瓶中小城.webp";
import pearlClam from "@/assets/explore-corridor/通用交互物/珠母巨蚌.webp";
import clockworkArena from "@/assets/explore-corridor/通用交互物/发条擂台.webp";
import waterwheelGrindstone from "@/assets/explore-corridor/通用交互物/水车磨石.webp";
import armorMannequin from "@/assets/explore-corridor/通用交互物/拼甲人台.webp";
import lightningStump from "@/assets/explore-corridor/通用交互物/雷劈钱剑桩.webp";
import fortuneFox from "@/assets/explore-corridor/通用交互物/叼牌灵狐.webp";
import mapTortoise from "@/assets/explore-corridor/通用交互物/负图老龟.webp";
import puffball from "@/assets/explore-corridor/通用交互物/鼓囊菇.webp";
import jadeRabbitMortar from "@/assets/explore-corridor/通用交互物/玉兔药臼.webp";
import potteryPigBank from "@/assets/explore-corridor/通用交互物/陶猪扑满.webp";
import type { CorridorPropArt } from "./corridorArt";
import { sizeCorridorProp } from "./corridorPropSizing";

/**
 * 通用交互物素材，全部取自 assets/explore-corridor/通用交互物/。
 * 边界为主体(不透明度≥128)上下像素，bottom 取最后一行 +1；换图后重新运行 scripts/convert-curio-art.mjs 取值。
 * 尺寸档按小 / 中 / 大登记。
 */
export const COMMON_PROP_ASSETS = {
  moonBasin: sizeCorridorProp(moonBasin, { width: 562, height: 573, top: 19, bottom: 570 }, "medium"),
  soundBellRack: sizeCorridorProp(soundBellRack, { width: 511, height: 558, top: 3, bottom: 556 }, "medium"),
  sealPillar: sizeCorridorProp(sealPillar, { width: 554, height: 540, top: 4, bottom: 537 }, "large"),
  whaleGramophone: sizeCorridorProp(whaleGramophone, { width: 571, height: 495, top: 3, bottom: 491 }, "medium"),
  stoneShrine: sizeCorridorProp(stoneShrine, { width: 308, height: 308, top: 14, bottom: 280 }, "medium"),
  dreamLoom: sizeCorridorProp(dreamLoom, { width: 427, height: 640, top: 3, bottom: 637 }, "medium"),
  wingCourier: sizeCorridorProp(wingCourier, { width: 400, height: 400, top: 4, bottom: 368 }, "medium"),
  mossMailbox: sizeCorridorProp(mossMailbox, { width: 562, height: 640, top: 13, bottom: 633 }, "medium"),
  robotMerchant: sizeCorridorProp(robotMerchant, { width: 362, height: 272, top: 4, bottom: 263 }, "medium"),
  oakSignpost: sizeCorridorProp(oakSignpost, { width: 557, height: 640, top: 7, bottom: 628 }, "medium"),
  // 重设计八件（docs/交互物美术重设计.md）。
  sleepCatVault: sizeCorridorProp(sleepCatVault, { width: 503, height: 492, top: 2, bottom: 489 }, "medium"),
  rustSnailShell: sizeCorridorProp(rustSnailShell, { width: 536, height: 450, top: 3, bottom: 448 }, "medium"),
  starSandHourglass: sizeCorridorProp(starSandHourglass, { width: 480, height: 537, top: 3, bottom: 534 }, "large"),
  triPetalLotus: sizeCorridorProp(triPetalLotus, { width: 624, height: 452, top: 3, bottom: 450 }, "large"),
  miasmaTapir: sizeCorridorProp(miasmaTapir, { width: 651, height: 521, top: 3, bottom: 518 }, "medium"),
  reverseSakuraSpring: sizeCorridorProp(reverseSakuraSpring, { width: 556, height: 520, top: 3, bottom: 517 }, "large"),
  stoppedCuckooClock: sizeCorridorProp(stoppedCuckooClock, { width: 476, height: 534, top: 4, bottom: 532 }, "medium"),
  bottledTown: sizeCorridorProp(bottledTown, { width: 595, height: 442, top: 3, bottom: 438 }, "medium"),
  // 不合格十件重做（docs/交互物美术重做-不合格十件.md）。
  pearlClam: sizeCorridorProp(pearlClam, { width: 611, height: 534, top: 3, bottom: 530 }, "small"),
  clockworkArena: sizeCorridorProp(clockworkArena, { width: 577, height: 546, top: 5, bottom: 542 }, "medium"),
  waterwheelGrindstone: sizeCorridorProp(waterwheelGrindstone, { width: 600, height: 522, top: 6, bottom: 519 }, "medium"),
  armorMannequin: sizeCorridorProp(armorMannequin, { width: 524, height: 483, top: 4, bottom: 481 }, "medium"),
  lightningStump: sizeCorridorProp(lightningStump, { width: 513, height: 495, top: 3, bottom: 492 }, "medium"),
  fortuneFox: sizeCorridorProp(fortuneFox, { width: 472, height: 453, top: 3, bottom: 450 }, "medium"),
  mapTortoise: sizeCorridorProp(mapTortoise, { width: 519, height: 441, top: 4, bottom: 438 }, "large"),
  puffball: sizeCorridorProp(puffball, { width: 477, height: 418, top: 3, bottom: 414 }, "large"),
  jadeRabbitMortar: sizeCorridorProp(jadeRabbitMortar, { width: 499, height: 548, top: 5, bottom: 545 }, "medium"),
  potteryPigBank: sizeCorridorProp(potteryPigBank, { width: 503, height: 493, top: 3, bottom: 490 }, "small"),
} satisfies Record<string, CorridorPropArt>;

export type CommonPropAssetId = keyof typeof COMMON_PROP_ASSETS;
