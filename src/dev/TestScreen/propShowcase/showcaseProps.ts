import type { ComponentType } from "react";
import { GachaMachine, GACHA_SIZE } from "./props/gacha/GachaMachine";
import { ChargingPile, CHARGING_PILE_SIZE } from "./props/charging/ChargingPile";
import { HoloBillboard, HOLO_BILLBOARD_SIZE } from "./props/billboard/HoloBillboard";
import { PowerCabinet, POWER_CABINET_SIZE } from "./props/cabinet/PowerCabinet";
import { DormantBot, DORMANT_BOT_SIZE } from "./props/bot/DormantBot";

export interface ShowcasePropDef {
  id: string;
  name: string;
  /** 演示用的交互动词。 */
  verb: string;
  width: number;
  height: number;
  /** 物件底边中心在 1920 设计画布上的横坐标。 */
  x: number;
  /** live=false 只画静态底图(呼吸光副本用)。 */
  Art: ComponentType<{ live?: boolean }>;
}

/** 演示页物件登记：尺寸即 SVG 设计 px，底边贴地面线。 */
export const SHOWCASE_PROPS: readonly ShowcasePropDef[] = [
  { id: "gacha", name: "霓虹扭蛋机", verb: "投币扭蛋", ...GACHA_SIZE, x: 200, Art: GachaMachine },
  { id: "charging", name: "街角充电桩", verb: "补充电量", ...CHARGING_PILE_SIZE, x: 520, Art: ChargingPile },
  { id: "billboard", name: "全息广告灯箱", verb: "调取广告", ...HOLO_BILLBOARD_SIZE, x: 880, Art: HoloBillboard },
  { id: "cabinet", name: "街区配电箱", verb: "拆解线路", ...POWER_CABINET_SIZE, x: 1430, Art: PowerCabinet },
  { id: "bot", name: "休眠服务机器人", verb: "尝试唤醒", ...DORMANT_BOT_SIZE, x: 1740, Art: DormantBot },
];

/** 身高参照角色的横坐标。 */
export const SHOWCASE_PLAYER_X = 1160;
