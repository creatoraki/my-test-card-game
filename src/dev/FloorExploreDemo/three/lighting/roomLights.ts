import * as THREE from "three";
import type { LightDef, WallSide } from "../../types";
import { yawOf } from "../../engine/rect";
import { box, cylinder } from "../core/geometryUtils";
import { createLightShaft } from "../fx/lightShafts";
import type { DustMotes } from "../fx/dustMotes";
import { signTexture } from "../textures/decalTextures";
import type { BuildContext } from "../room/buildContext";
import { flickerValue } from "./flicker";

const TUBE_Y = 2.72;
const WALL_INWARD: Record<WallSide, [number, number]> = { x0: [1, 0], x1: [-1, 0], z0: [0, 1], z1: [0, -1] };

interface LightBuild {
  group: THREE.Group;
  /** 浮尘发光点。 */
  dust: { position: THREE.Vector3; color: THREE.Color; strength: number }[];
  update?: (t: number) => void;
}

function shadowSetup(light: THREE.SpotLight, size: number, near: number, far: number): void {
  light.castShadow = true;
  light.shadow.mapSize.set(size, size);
  light.shadow.camera.near = near;
  light.shadow.camera.far = far;
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.03;
  light.shadow.radius = 4;
}

function glowMaterial(ctx: BuildContext, color: THREE.Color): THREE.MeshBasicMaterial {
  return ctx.disposer.track(new THREE.MeshBasicMaterial({ color: color.clone() }));
}

/** 吊顶日光灯管: 灯箱 + 发光灯罩 + 吊线, 向下的聚光灯与光锥。熄灭的灯管一头脱落斜挂。 */
function buildTube(ctx: BuildContext, def: LightDef, seed: number): LightBuild {
  const group = new THREE.Group();
  const mode = def.flicker ?? "steady";
  const color = new THREE.Color(def.color ?? 0xdbe8ff);
  const fixture = new THREE.Group();
  const housing = ctx.kit.plain(0x303436, { roughness: 0.5, metalness: 0.6 });
  fixture.add(box(1.25, 0.07, 0.22, housing, 0, 0, 0, { cast: true, receive: false }));
  const glow = mode === "off" ? ctx.kit.plain(0x55595a, { roughness: 0.4 }) : glowMaterial(ctx, color);
  fixture.add(box(1.18, 0.03, 0.15, glow, 0, -0.045, 0, { cast: false, receive: false }));
  const cableMat = ctx.kit.plain(0x111111, { roughness: 0.7 });
  if (mode === "off") {
    // 一端吊线断了, 灯箱斜挂下来
    const pivot = new THREE.Group();
    pivot.position.set(def.x + 0.6, TUBE_Y, def.z);
    fixture.position.set(-0.6, 0, 0);
    pivot.rotation.z = 0.55;
    pivot.add(fixture);
    group.add(pivot);
    group.add(cylinder(0.006, 0.006, 3.05 - TUBE_Y, cableMat, 4, def.x + 0.6, (3.05 + TUBE_Y) / 2, def.z));
    return { group, dust: [] };
  }
  fixture.position.set(def.x, TUBE_Y, def.z);
  group.add(fixture);
  for (const dx of [-0.5, 0.5]) group.add(cylinder(0.006, 0.006, 3.05 - TUBE_Y, cableMat, 4, def.x + dx, (3.05 + TUBE_Y) / 2, def.z));

  const base = def.intensity ?? 28;
  const spot = new THREE.SpotLight(color, base, 12, 1.08, 0.85, 2);
  spot.position.set(def.x, TUBE_Y - 0.08, def.z);
  spot.target.position.set(def.x, 0, def.z);
  if (def.shadow) shadowSetup(spot, 1024, 0.3, 9);
  group.add(spot, spot.target);
  const shaft = createLightShaft(new THREE.Vector3(def.x, TUBE_Y - 0.06, def.z), new THREE.Vector3(def.x, 0, def.z), 0.5, 1.9, color.getHex(), 0.085);
  group.add(shaft.mesh);
  const glowColor = color.clone();
  return {
    group,
    dust: [{ position: new THREE.Vector3(def.x, 1.5, def.z), color, strength: 1 }],
    update: (t) => {
      const f = flickerValue(mode, t, seed);
      spot.intensity = base * f;
      shaft.setIntensity(f);
      shaft.material.uniforms.uTime.value = t;
      (glow as THREE.MeshBasicMaterial).color.copy(glowColor).multiplyScalar(0.25 + f * 3.2);
    },
  };
}

function wallMount(def: LightDef): { yaw: number; inward: [number, number] } {
  const inward = WALL_INWARD[def.wall ?? "z0"];
  return { yaw: yawOf(inward[0], inward[1]), inward };
}

/** 红色应急灯: 墙上的小灯箱 + 慢呼吸的点光。 */
function buildEmergency(ctx: BuildContext, def: LightDef, seed: number): LightBuild {
  const group = new THREE.Group();
  const color = new THREE.Color(def.color ?? 0xff2a14);
  const y = def.y ?? 2.5;
  const { yaw, inward } = wallMount(def);
  const mount = new THREE.Group();
  mount.position.set(def.x, y, def.z);
  mount.rotation.y = yaw;
  mount.add(box(0.34, 0.14, 0.1, ctx.kit.plain(0xd9d6cc, { roughness: 0.6 }), 0, 0, 0.05));
  const lens = glowMaterial(ctx, color);
  mount.add(box(0.26, 0.07, 0.03, lens, 0, -0.01, 0.11, { cast: false, receive: false }));
  group.add(mount);
  const base = def.intensity ?? 4;
  const point = new THREE.PointLight(color, base, 7, 2);
  point.position.set(def.x + inward[0] * 0.3, y - 0.1, def.z + inward[1] * 0.3);
  group.add(point);
  const mode = def.flicker ?? "pulse";
  return {
    group,
    dust: [{ position: point.position.clone(), color, strength: 0.6 }],
    update: (t) => {
      const f = flickerValue(mode, t, seed);
      point.intensity = base * f;
      lens.color.copy(color).multiplyScalar(0.6 + f * 3);
    },
  };
}

/** 月光: 窗外高处的聚光灯穿过窗洞投下窗棂阴影, 配一道长长的光束。 */
function buildMoon(ctx: BuildContext, def: LightDef): LightBuild {
  const group = new THREE.Group();
  const color = new THREE.Color(def.color ?? 0x8fb0ff);
  const target = new THREE.Vector3(...(def.target ?? [def.x, 0, def.z + 4]));
  const from = new THREE.Vector3(def.x, def.y ?? 6, def.z);
  const spot = new THREE.SpotLight(color, def.intensity ?? 4, 0, 0.3, 0.55, 0);
  spot.position.copy(from);
  spot.target.position.copy(target);
  if (def.shadow) shadowSetup(spot, 2048, 1, 22);
  group.add(spot, spot.target);
  const shaft = createLightShaft(from, target, 0.25, 1.35, color.getHex(), 0.16);
  group.add(shaft.mesh);
  const dust = [0.55, 0.75, 0.92].map((k) => ({ position: from.clone().lerp(target, k), color, strength: 1.3 }));
  return { group, dust, update: (t) => { shaft.material.uniforms.uTime.value = t; } };
}

/** 安全出口指示牌: 绿色自发光 + 小范围点光。 */
function buildExit(ctx: BuildContext, def: LightDef): LightBuild {
  const group = new THREE.Group();
  const color = new THREE.Color(def.color ?? 0x2cff7a);
  const { yaw, inward } = wallMount(def);
  const shell = ctx.kit.plain(0x1c2420, { roughness: 0.5 });
  const face = ctx.disposer.track(new THREE.MeshBasicMaterial({ map: signTexture("安全出口", "#4dff9a"), color: new THREE.Color(2.4, 2.4, 2.4) }));
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.07), [shell, shell, shell, shell, face, shell]);
  sign.position.set(def.x, def.y ?? 2.35, def.z);
  sign.rotation.y = yaw;
  group.add(sign);
  const point = new THREE.PointLight(color, def.intensity ?? 4, 5, 2);
  point.position.set(def.x + inward[0] * 0.35, (def.y ?? 2.35) - 0.1, def.z + inward[1] * 0.35);
  group.add(point);
  return { group, dust: [{ position: point.position.clone(), color, strength: 0.8 }] };
}

/** 台灯: 暖色小聚光, 照亮一张桌面。 */
function buildLamp(ctx: BuildContext, def: LightDef, seed: number): LightBuild {
  const group = new THREE.Group();
  const color = new THREE.Color(def.color ?? 0xffa860);
  const y = def.y ?? 0.78;
  const metal = ctx.kit.plain(0x2d3a33, { roughness: 0.45, metalness: 0.5 });
  const lamp = new THREE.Group();
  lamp.position.set(def.x, y, def.z);
  lamp.add(cylinder(0.08, 0.09, 0.03, metal, 16, 0, 0.015, 0));
  const arm = cylinder(0.012, 0.012, 0.42, metal, 6, 0, 0.21, 0);
  arm.rotation.z = 0.25;
  lamp.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 16, 1, true), ctx.kit.plain(0x2d3a33, { roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide }));
  shade.position.set(-0.08, 0.42, 0);
  shade.rotation.z = -0.5;
  lamp.add(shade);
  const bulb = glowMaterial(ctx, color);
  const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), bulb);
  bulbMesh.position.set(-0.1, 0.38, 0);
  lamp.add(bulbMesh);
  group.add(lamp);
  const base = def.intensity ?? 5;
  const spot = new THREE.SpotLight(color, base, 4, 0.9, 0.7, 2);
  spot.position.set(def.x - 0.1, y + 0.38, def.z);
  spot.target.position.set(def.x - 0.35, 0, def.z + 0.15);
  group.add(spot, spot.target);
  return {
    group,
    dust: [{ position: new THREE.Vector3(def.x - 0.1, y + 0.2, def.z), color, strength: 0.7 }],
    update: (t) => {
      const f = flickerValue(def.flicker ?? "steady", t, seed);
      spot.intensity = base * f;
      bulb.color.copy(color).multiplyScalar(0.8 + f * 3);
    },
  };
}

/** 按房间数据生成全部灯光, 并把发光点登记给浮尘。 */
export function buildRoomLights(ctx: BuildContext, dust: DustMotes | null): THREE.Group {
  const group = new THREE.Group();
  group.name = "lights";
  let dustIndex = 0;
  ctx.room.lights.forEach((def, i) => {
    const seed = i * 7.31 + ctx.room.id.length;
    const build = def.kind === "tube" ? buildTube(ctx, def, seed)
      : def.kind === "emergency" ? buildEmergency(ctx, def, seed)
        : def.kind === "moon" ? buildMoon(ctx, def)
          : def.kind === "exit" ? buildExit(ctx, def)
            : buildLamp(ctx, def, seed);
    group.add(build.group);
    if (build.update) {
      const update = build.update;
      ctx.animated.push({ update: (t) => update(t) });
    }
    for (const spot of build.dust) {
      dust?.setLight(dustIndex, spot.position, spot.color, spot.strength);
      dustIndex += 1;
    }
  });
  return group;
}
