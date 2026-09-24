import * as THREE from "three";
import { STRUCTURE } from "../../data";
import { createGuard, stepGuard, type GuardState } from "../../engine/guardPatrol";
import type { RoomDef } from "../../types";
import { buildShadowGuard, type GuardView } from "../actors/shadowGuard";
import { Disposer } from "../core/disposer";
import { buildDecor } from "../decor/decorFactory";
import { createDustMotes } from "../fx/dustMotes";
import { createGroundFog } from "../fx/groundFog";
import { buildRoomLights } from "../lighting/roomLights";
import type { MaterialKit } from "../materials/materialKit";
import { buildProps, type PropView } from "../props/propFactory";
import { mulberry32 } from "../textures/canvasNoise";
import type { Animated, BuildContext } from "./buildContext";
import { buildDoorways } from "./doorway";
import { buildShell } from "./buildShell";
import { buildWindows } from "./windows";

export interface RoomView {
  room: RoomDef;
  group: THREE.Group;
  props: PropView[];
  pickables: THREE.Object3D[];
  update(t: number, dt: number): void;
  dispose(): void;
}

function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** 组装一个房间的全部可视内容。同一时间只存在一个房间, 换房时整体销毁。 */
export function buildRoom(kit: MaterialKit, room: RoomDef, pixelRatio: number): RoomView {
  const disposer = new Disposer();
  const animated: Animated[] = [];
  const ctx: BuildContext = { room, kit, disposer, animated, pickables: [], rng: mulberry32(seedOf(room.id)) };
  const group = new THREE.Group();
  group.name = `room:${room.id}`;

  group.add(buildShell(ctx), buildWindows(ctx), buildDoorways(ctx), buildDecor(ctx));
  const props = buildProps(ctx);
  group.add(props.group);

  const dust = createDustMotes(room.width, room.depth, STRUCTURE.wallHeight, room.mood.dust, pixelRatio, ctx.rng);
  disposer.track(dust.material);
  group.add(dust.points);
  group.add(buildRoomLights(ctx, dust));

  const fog = createGroundFog(room.width, room.depth, room.mood.fog, room.mood.fogDensity);
  fog.materials.forEach((material) => disposer.track(material));
  group.add(fog.group);

  group.add(new THREE.HemisphereLight(room.mood.sky, room.mood.ground, room.mood.ambient));

  const guards: { state: GuardState; view: GuardView }[] = room.guards.map((def, i) => {
    const view = buildShadowGuard(disposer, i * 3.7 + 1.3, pixelRatio);
    group.add(view.root);
    return { state: createGuard(def), view };
  });

  return {
    room,
    group,
    props: props.views,
    pickables: ctx.pickables,
    update: (t, dt) => {
      for (const item of animated) item.update(t, dt);
      dust.material.uniforms.uTime.value = t;
      for (const material of fog.materials) material.uniforms.uTime.value = t;
      for (const guard of guards) {
        stepGuard(guard.state, dt);
        guard.view.update(guard.state, t, dt);
      }
    },
    dispose: () => disposer.disposeTree(group),
  };
}
