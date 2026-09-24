import * as THREE from "three";
import type { DecorDef, DecorKind } from "../../types";
import type { BuildContext } from "../room/buildContext";
import { buildBench, buildBoxes, buildChair, buildDesk, buildPartition, buildPlant, buildTable } from "./officeFurniture";
import { buildBoard, buildCounter, buildShelf, buildWater } from "./roomFixtures";
import { buildCable, buildDebris, buildGlass, buildPapers, buildPuddle } from "./ruinDecor";
import { buildElevator, buildExtinguisher, buildFloorSign, buildPipes, buildStairs, buildTape } from "./structureDecor";

type DecorBuilder = (ctx: BuildContext, def: DecorDef) => THREE.Group;

const BUILDERS: Record<DecorKind, DecorBuilder> = {
  desk: buildDesk,
  partition: buildPartition,
  chair: buildChair,
  table: buildTable,
  plant: buildPlant,
  boxes: buildBoxes,
  bench: buildBench,
  counter: buildCounter,
  water: buildWater,
  shelf: buildShelf,
  board: buildBoard,
  elevator: buildElevator,
  stairs: buildStairs,
  pipes: buildPipes,
  extinguisher: buildExtinguisher,
  debris: buildDebris,
  papers: buildPapers,
  puddle: buildPuddle,
  glass: buildGlass,
  tape: buildTape,
  cable: buildCable,
  sign: buildFloorSign,
};

/** 生成房间全部装饰。挂墙类装饰由构建函数自己决定朝向, 其余按 rot 摆放。 */
export function buildDecor(ctx: BuildContext): THREE.Group {
  const group = new THREE.Group();
  group.name = "decor";
  for (const def of ctx.room.decor) {
    const object = BUILDERS[def.kind](ctx, def);
    object.position.set(def.x, 0, def.z);
    if (!def.wall) object.rotation.y = def.rot ?? 0;
    group.add(object);
  }
  return group;
}
