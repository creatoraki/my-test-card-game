import forgeBench from "@/assets/explore-corridor/公共交互物/赤铜锻造台.webp";
import pearlMirror from "@/assets/explore-corridor/公共交互物/珍珠鉴宝镜台.webp";
import whalePhonograph from "@/assets/explore-corridor/公共交互物/月鲸留声机.webp";
import spiceCart from "@/assets/explore-corridor/公共交互物/香料交换车.webp";
import glassFurnace from "@/assets/explore-corridor/公共交互物/琉璃炼金炉.webp";
import dreamLoom from "@/assets/explore-corridor/公共交互物/紫晶织梦机.webp";
import butterflyCabinet from "@/assets/explore-corridor/公共交互物/蝶钥委托柜.webp";
import dewApothecary from "@/assets/explore-corridor/公共交互物/萤露调药台.webp";
import vineChest from "@/assets/explore-corridor/公共交互物/藤叶探险箱.webp";
import mossMailbox from "@/assets/explore-corridor/公共交互物/苔铃邮筒.webp";
import herbBag from "@/assets/explore-corridor/公共交互物/草药旅行布袋.webp";
import roseTeaTable from "@/assets/explore-corridor/公共交互物/蔷薇焙茶台.webp";
import thunderCrystal from "@/assets/explore-corridor/公共交互物/雷萤充能座.webp";
import oakSignpost from "@/assets/explore-corridor/公共交互物/橡叶岔路牌.webp";
import shrine from "@/assets/explore-corridor/废弃楼层/可交互物体/神龛.webp";
import type { CurioKind } from "@/explore/corridor/types";
import type { CorridorPropArt } from "./corridorArt";
import { sizeCorridorProp } from "./corridorPropSizing";

/**
 * 各地图通用的童话手绘交互物：素材已裁去透明边并等比缩到最长边 640px，
 * 边界为裁切后不透明区域的上下像素，换图后需重新测量。
 */
/** 物品箱在小档基础上再缩到 70%，避免箱子比角色还显眼。 */
const BOX_SHRINK = 0.7;
/** 锻造台横向很宽，中档下压迫感太强，缩到 70%。 */
const FORGE_SHRINK = 0.7;
/** 锻造师所在的锻造台再小一圈，避免盖过身旁的人物。 */
const BLACKSMITH_SHRINK = 0.8;

function shrinkProp(art: CorridorPropArt, factor: number): CorridorPropArt {
  return { ...art, scale: art.scale * factor };
}

const FORGE_BENCH = shrinkProp(sizeCorridorProp(forgeBench, { width: 640, height: 460, top: 12, bottom: 448 }, "medium"), FORGE_SHRINK);
const BLACKSMITH_BENCH = shrinkProp(FORGE_BENCH, BLACKSMITH_SHRINK);
const PEARL_MIRROR = sizeCorridorProp(pearlMirror, { width: 640, height: 432, top: 3, bottom: 420 }, "medium");
const WHALE_PHONOGRAPH = sizeCorridorProp(whalePhonograph, { width: 640, height: 631, top: 4, bottom: 619 }, "medium");
const SPICE_CART = sizeCorridorProp(spiceCart, { width: 640, height: 497, top: 10, bottom: 485 }, "medium");
const GLASS_FURNACE = sizeCorridorProp(glassFurnace, { width: 452, height: 640, top: 8, bottom: 628 }, "large");
const DREAM_LOOM = sizeCorridorProp(dreamLoom, { width: 427, height: 640, top: 2, bottom: 638 }, "medium");
const BUTTERFLY_CABINET = sizeCorridorProp(butterflyCabinet, { width: 237, height: 640, top: 3, bottom: 629 }, "medium");
const DEW_APOTHECARY = sizeCorridorProp(dewApothecary, { width: 640, height: 403, top: 8, bottom: 391 }, "medium");
const VINE_CHEST = shrinkProp(sizeCorridorProp(vineChest, { width: 640, height: 544, top: 13, bottom: 532 }, "small"), BOX_SHRINK);
const MOSS_MAILBOX = sizeCorridorProp(mossMailbox, { width: 562, height: 640, top: 12, bottom: 633 }, "medium");
const HERB_BAG = sizeCorridorProp(herbBag, { width: 640, height: 607, top: 12, bottom: 595 }, "small");
const ROSE_TEA_TABLE = sizeCorridorProp(roseTeaTable, { width: 640, height: 416, top: 5, bottom: 404 }, "medium");
const THUNDER_CRYSTAL = sizeCorridorProp(thunderCrystal, { width: 435, height: 640, top: 5, bottom: 628 }, "medium");
const OAK_SIGNPOST = sizeCorridorProp(oakSignpost, { width: 557, height: 640, top: 6, bottom: 629 }, "medium");
/** 旧版神龛画风与新素材相容，保留给神龛与各类遗物匣。 */
const SHRINE = sizeCorridorProp(shrine, { width: 308, height: 308, top: 13, bottom: 280 }, "medium");

/** 通用事件池的素材分配；同图多用的物件在文案上各自对应同一件实物的不同用法。 */
export const COMMON_PROP_ART = {
  // 换金物 / 材料 / 食品 / 道具
  cashBox: HERB_BAG,
  supplyCrate: VINE_CHEST,
  toolLocker: FORGE_BENCH,
  safe: BUTTERFLY_CABINET,
  courierDrone: HERB_BAG,
  vending: WHALE_PHONOGRAPH,
  compactor: GLASS_FURNACE,
  crystalVein: THUNDER_CRYSTAL,
  moduleCase: DREAM_LOOM,
  remains: OAK_SIGNPOST,
  modBench: DREAM_LOOM,
  // 装备、遗物与成长服务
  equipmentCache: MOSS_MAILBOX,
  bondWorkbench: DREAM_LOOM,
  perfectnessWorkbench: PEARL_MIRROR,
  relicCache: SHRINE,
  temporaryRelicCache: SHRINE,
  shrine: SHRINE,
  merchant: SPICE_CART,
  // 锻造师在场景里以锻造台出现，比通用锻造台再缩小一圈。
  blacksmith: BLACKSMITH_BENCH,
  // 治疗与粒子补给：同房只投放一个，共用素材不会同屏
  medical: DEW_APOTHECARY,
  repairPod: DEW_APOTHECARY,
  sink: ROSE_TEA_TABLE,
  energyStation: THUNDER_CRYSTAL,
  // 新手关卡
  tutorialArmory: MOSS_MAILBOX,
  tutorialModBench: DREAM_LOOM,
  tutorialMedical: DEW_APOTHECARY,
  tutorialRelicCache: SHRINE,
  tutorialCashBox: HERB_BAG,
} satisfies Partial<Record<CurioKind, CorridorPropArt>>;
