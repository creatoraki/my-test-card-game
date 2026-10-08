import forgeBench from "@/assets/explore-corridor/公共交互物/赤铜锻造台.webp";
import pearlMirror from "@/assets/explore-corridor/公共交互物/珍珠鉴宝镜台.webp";
import whalePhonograph from "@/assets/explore-corridor/公共交互物/月鲸留声机.webp";
import spiceCart from "@/assets/explore-corridor/公共交互物/香料交换车.webp";
import tideChest from "@/assets/explore-corridor/公共交互物/潮汐机械宝匣.webp";
import coralVault from "@/assets/explore-corridor/公共交互物/珊瑚宝库.webp";
import tideGate from "@/assets/explore-corridor/公共交互物/潮汐祈愿门.webp";
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
import type { CurioKind } from "@/explore/corridor/types";
import type { CorridorPropArt } from "./corridorArt";
import { sizeCorridorProp } from "./corridorPropSizing";

/**
 * 各地图通用的童话手绘交互物：素材已裁去透明边并等比缩到最长边 640px，
 * 边界为裁切后不透明区域的上下像素，换图后需重新测量。
 */
const FORGE_BENCH = sizeCorridorProp(forgeBench, { width: 640, height: 460, top: 12, bottom: 448 }, "medium");
const PEARL_MIRROR = sizeCorridorProp(pearlMirror, { width: 640, height: 432, top: 3, bottom: 420 }, "medium");
const WHALE_PHONOGRAPH = sizeCorridorProp(whalePhonograph, { width: 640, height: 631, top: 4, bottom: 619 }, "medium");
const SPICE_CART = sizeCorridorProp(spiceCart, { width: 640, height: 497, top: 10, bottom: 485 }, "medium");
const TIDE_CHEST = sizeCorridorProp(tideChest, { width: 640, height: 640, top: 8, bottom: 628 }, "small");
const CORAL_VAULT = sizeCorridorProp(coralVault, { width: 640, height: 582, top: 12, bottom: 570 }, "medium");
const TIDE_GATE = sizeCorridorProp(tideGate, { width: 530, height: 640, top: 7, bottom: 628 }, "large");
const GLASS_FURNACE = sizeCorridorProp(glassFurnace, { width: 452, height: 640, top: 8, bottom: 628 }, "large");
const DREAM_LOOM = sizeCorridorProp(dreamLoom, { width: 427, height: 640, top: 2, bottom: 638 }, "medium");
const BUTTERFLY_CABINET = sizeCorridorProp(butterflyCabinet, { width: 237, height: 640, top: 3, bottom: 629 }, "medium");
const DEW_APOTHECARY = sizeCorridorProp(dewApothecary, { width: 640, height: 403, top: 8, bottom: 391 }, "medium");
const VINE_CHEST = sizeCorridorProp(vineChest, { width: 640, height: 544, top: 13, bottom: 532 }, "small");
const MOSS_MAILBOX = sizeCorridorProp(mossMailbox, { width: 562, height: 640, top: 12, bottom: 633 }, "medium");
const HERB_BAG = sizeCorridorProp(herbBag, { width: 640, height: 607, top: 12, bottom: 595 }, "small");
const ROSE_TEA_TABLE = sizeCorridorProp(roseTeaTable, { width: 640, height: 416, top: 5, bottom: 404 }, "medium");
const THUNDER_CRYSTAL = sizeCorridorProp(thunderCrystal, { width: 435, height: 640, top: 5, bottom: 628 }, "medium");
const OAK_SIGNPOST = sizeCorridorProp(oakSignpost, { width: 557, height: 640, top: 6, bottom: 629 }, "medium");

/** 通用事件池的素材分配；同图多用的物件在文案上各自对应同一件实物的不同用法。 */
export const COMMON_PROP_ART = {
  // 换金物 / 材料 / 食品 / 道具
  cashBox: HERB_BAG,
  supplyCrate: VINE_CHEST,
  toolLocker: FORGE_BENCH,
  safe: BUTTERFLY_CABINET,
  courierDrone: MOSS_MAILBOX,
  vending: WHALE_PHONOGRAPH,
  compactor: GLASS_FURNACE,
  crystalVein: THUNDER_CRYSTAL,
  moduleCase: TIDE_CHEST,
  remains: OAK_SIGNPOST,
  modBench: FORGE_BENCH,
  // 装备、遗物与成长服务
  equipmentCache: TIDE_CHEST,
  bondWorkbench: DREAM_LOOM,
  perfectnessWorkbench: PEARL_MIRROR,
  relicCache: CORAL_VAULT,
  temporaryRelicCache: CORAL_VAULT,
  shrine: TIDE_GATE,
  merchant: SPICE_CART,
  // 治疗与粒子补给：同房只投放一个，共用素材不会同屏
  medical: DEW_APOTHECARY,
  repairPod: DEW_APOTHECARY,
  sink: ROSE_TEA_TABLE,
  energyStation: THUNDER_CRYSTAL,
  // 新手关卡
  tutorialArmory: TIDE_CHEST,
  tutorialModBench: FORGE_BENCH,
  tutorialMedical: DEW_APOTHECARY,
  tutorialRelicCache: CORAL_VAULT,
  tutorialCashBox: HERB_BAG,
} satisfies Partial<Record<CurioKind, CorridorPropArt>>;
