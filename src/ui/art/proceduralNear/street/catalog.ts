import type { StreetKind, StreetPlacement } from "../types";
import type { StreetSpec } from "./common";
import { benchSpec, busStopSpec, shelterSeatSpec } from "./rest";
import { vendingSpec } from "./vending";
import { infoKioskSpec, newsstandSpec, phoneBoothSpec } from "./kiosk";
import { foodCartSpec } from "./foodCart";
import { streetLampSpec } from "./streetLamp";
import { hydrantSpec, mailboxSpec, utilityBoxSpec } from "./utility";
import { binsSpec } from "./bins";
import { bicycleSpec, motorbikeSpec } from "./vehicles";
import { conesSpec, guardRailSpec, waterBarrierSpec } from "./traffic";

/** 街道设施登记表：新增设施只需实现一个 StreetSpec 并登记到这里。 */
export const STREET_SPECS: Record<StreetKind, StreetSpec> = {
  busStop: busStopSpec,
  bench: benchSpec,
  shelterSeat: shelterSeatSpec,
  vending: vendingSpec,
  infoKiosk: infoKioskSpec,
  phoneBooth: phoneBoothSpec,
  newsstand: newsstandSpec,
  foodCart: foodCartSpec,
  streetLamp: streetLampSpec,
  utilityBox: utilityBoxSpec,
  hydrant: hydrantSpec,
  mailbox: mailboxSpec,
  bins: binsSpec,
  motorbike: motorbikeSpec,
  bicycle: bicycleSpec,
  cones: conesSpec,
  waterBarrier: waterBarrierSpec,
  guardRail: guardRailSpec,
};

/** 小广场里的大件（重复项即权重）。 */
export const PLAZA_KINDS: readonly StreetKind[] = ["busStop", "busStop", "bench", "shelterSeat", "newsstand", "foodCart", "foodCart", "phoneBooth", "infoKiosk"];
/** 楼前 / 巷口的小件。 */
export const SMALL_KINDS: readonly StreetKind[] = ["bins", "bins", "utilityBox", "mailbox", "bicycle", "motorbike", "motorbike", "hydrant", "bench", "vending", "phoneBooth", "cones"];
/** 前景只放细长或矮小的设施，避免大面积挡住角色。 */
export const FORE_KINDS: readonly StreetKind[] = ["streetLamp", "streetLamp", "guardRail", "guardRail", "hydrant", "cones", "waterBarrier"];

export function streetLabel(kind: StreetKind): string {
  return STREET_SPECS[kind].label;
}

export function drawStreet(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  STREET_SPECS[p.kind].draw(ctx, p);
}
