import * as THREE from "three";
import { worldY } from "../../data/layout";
import type { RoomDef } from "../../types";
import type { RigUniforms } from "../lighting/lightRig";
import type { ZoneShaders } from "../zones";
import { buildDrip } from "./drips";
import { createAmbientPoints } from "./particles";
import type { BurstFx } from "./sparks";

export interface RoomFx {
  group: THREE.Group;
  update(dt: number): void;
}

/**
 * 按区域与房间的特效挂点组装环境特效: 浮尘(全房间)、孢子 / 余烬 / 花粉(区域)、滴水,
 * 以及坏灯周期性迸出的电火花。
 */
export function buildRoomFx(room: RoomDef, zone: ZoneShaders, rig: RigUniforms, burst: BurstFx, pixelScale: THREE.IUniform<number>): RoomFx {
  const group = new THREE.Group();
  group.add(createAmbientPoints({
    count: zone.dust.count,
    color: new THREE.Color(zone.dust.color).multiplyScalar(0.5),
    size: 5,
    alpha: 0.5,
    rise: 0,
    drift: 6,
    h0: 0,
    h1: 420,
    range: null,
    flicker: false,
  }, rig, pixelScale).points);

  const sparkTimers: { x: number; y: number; floor: number; next: number }[] = [];
  room.fx.forEach((fx, i) => {
    switch (fx.kind) {
      case "drip":
        group.add(buildDrip(fx, rig, i));
        break;
      case "spores":
      case "embers": {
        const w = fx.width ?? room.width;
        const spores = fx.kind === "spores";
        group.add(createAmbientPoints({
          count: spores ? 160 : 120,
          color: spores ? new THREE.Color(0.5, 0.03, 0.08) : new THREE.Color(1.2, 0.45, 0.12),
          size: spores ? 7 : 4,
          alpha: spores ? 0.8 : 0.9,
          rise: spores ? 18 : 40,
          drift: spores ? 4 : 10,
          h0: 0,
          h1: 460,
          range: [fx.x - w / 2, fx.x + w / 2],
          flicker: !spores,
        }, rig, pixelScale).points);
        break;
      }
      case "pollen":
        // 花粉: 暖金绿的细小光点, 缓慢上浮并左右飘荡
        group.add(createAmbientPoints({
          count: 150,
          color: new THREE.Color(0.9, 1.0, 0.45),
          size: 5,
          alpha: 0.75,
          rise: 12,
          drift: 14,
          h0: 0,
          h1: 440,
          range: [fx.x - (fx.width ?? room.width) / 2, fx.x + (fx.width ?? room.width) / 2],
          flicker: false,
        }, rig, pixelScale).points);
        break;
      case "sparks":
        sparkTimers.push({ x: fx.x, y: worldY(fx.z ?? 0, fx.h ?? 300), floor: worldY(140), next: 1 + Math.random() * 3 });
        break;
    }
  });

  return {
    group,
    update: (dt) => {
      for (const s of sparkTimers) {
        s.next -= dt;
        if (s.next > 0) continue;
        burst.spawn("sparks", s.x, s.y - 10, 8 + Math.floor(Math.random() * 10), s.floor);
        s.next = 2.5 + Math.random() * 4;
      }
    },
  };
}
