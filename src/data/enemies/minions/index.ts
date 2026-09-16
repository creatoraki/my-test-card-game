import type { EnemyDef } from "../types";
import { GLASS_JELLY } from "./glassJelly";
import { MAINTENANCE_SPIDER } from "./spider";
import { RADIO_BOT } from "./radioBot";
import { SWEEP_DRONE } from "./sweepDrone";
import { TRAFFIC_LIGHT_BOT } from "./trafficLight";

export const MINION_ENEMIES: EnemyDef[] = [
  RADIO_BOT,
  SWEEP_DRONE,
  MAINTENANCE_SPIDER,
  TRAFFIC_LIGHT_BOT,
  GLASS_JELLY,
];
