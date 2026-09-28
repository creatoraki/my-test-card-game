import { CORRIDOR, type CurioKind } from "@/explore/corridor/types";
import { createRandom, type NearScenePlan } from "@/ui/art/proceduralNear";
import type { DemoProp } from "../parts/DemoProps";

// 演示房间里随机投放的交互物：只取有专属素材的种类且不重复；避开门口、街道设施与前景设施，彼此拉开距离。
// 以房间种子派生随机，同一房间每次摆放一致。

const KINDS: readonly CurioKind[] = [
  "safe", "vending", "remains", "compactor", "medical", "sink", "repairPod",
  "modBench", "cardPrinter", "shrine", "dispatch", "crystalVein", "merchant",
];
const SPACING = 420;
const DOOR_CLEAR = 200;
const EDGE_CLEAR = 200;
const ITEM_CLEAR = 90;

export function planDemoProps(plan: NearScenePlan): DemoProp[] {
  const rnd = createRandom(plan.seed ^ 0x5eed);
  const min = CORRIDOR.walkMin + EDGE_CLEAR;
  const max = plan.width - CORRIDOR.walkMin - EDGE_CLEAR;
  const count = Math.max(2, Math.round(plan.width / 900));
  const doors = plan.lamps.filter((lamp) => lamp.door).map((lamp) => lamp.x);
  const items = [...plan.street, ...plan.fore];
  const pool = [...KINDS];
  const props: DemoProp[] = [];
  for (let attempt = 0; attempt < count * 16 && props.length < count && pool.length > 0; attempt++) {
    const x = Math.round(rnd.range(min, max));
    if (props.some((prop) => Math.abs(prop.x - x) < SPACING)) continue;
    if (doors.some((door) => Math.abs(door - x) < DOOR_CLEAR)) continue;
    if (items.some((s) => x > s.x - ITEM_CLEAR && x < s.x + s.width + ITEM_CLEAR)) continue;
    const [kind] = pool.splice(Math.floor(rnd.next() * pool.length), 1);
    props.push({ id: `prop-${props.length}`, kind, x });
  }
  return props.sort((a, b) => a.x - b.x);
}
