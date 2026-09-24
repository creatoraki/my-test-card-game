import * as THREE from "three";
import { box, cylinder } from "../core/geometryUtils";
import { flickerValue } from "../lighting/flicker";
import type { BuildContext } from "../room/buildContext";
import { signTexture, vendingTexture } from "../textures/decalTextures";

const W = 1;
const H = 1.9;
const D = 0.82;

/**
 * 故障售货机: 暗红机身、发光的商品灯箱(忽明忽暗)、顶部灯牌、右侧「暂停服务」小屏;
 * 自身就是茶水间的主光源 —— 朝前打一盏投影聚光, 再补一点冷色泛光。本地 +z 为正面。
 */
export function buildVendingMachine(ctx: BuildContext): THREE.Group {
  const g = new THREE.Group();
  const { kit } = ctx;
  const body = kit.surface("metal", { color: 0x8a2a25, metalness: 0.35, roughness: 1, bumpScale: 0.8 });
  const trim = kit.plain(0x1f2224, { roughness: 0.45, metalness: 0.6 });
  // 机身: 背板、两侧、顶、底座, 正面留出灯箱与控制面板
  g.add(box(W, H, 0.06, body, 0, H / 2, -D / 2 + 0.03));
  for (const s of [-1, 1]) g.add(box(0.05, H, D, body, s * (W / 2 - 0.025), H / 2, 0));
  g.add(box(W, 0.08, D, body, 0, H - 0.04, 0));
  g.add(box(W, 0.12, D, trim, 0, 0.06, 0));
  g.add(box(W - 0.1, 0.36, D - 0.1, body, 0, 0.3, -0.03));

  const color = new THREE.Color(0xbfefff);
  const panelMat = ctx.disposer.track(new THREE.MeshBasicMaterial({ map: vendingTexture(), color: color.clone() }));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.25), panelMat);
  panel.position.set(-0.13, 1.12, D / 2 - 0.1);
  g.add(panel);
  // 灯箱玻璃, 左下角碎了一块
  const glass = ctx.disposer.track(new THREE.MeshStandardMaterial({ color: 0x9fc8d8, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.14, depthWrite: false }));
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.95), glass);
  pane.position.set(-0.13, 1.28, D / 2 - 0.04);
  g.add(pane);
  g.add(box(0.66, 0.03, 0.04, trim, -0.13, 0.48, D / 2 - 0.03));
  g.add(box(0.66, 0.03, 0.04, trim, -0.13, 1.76, D / 2 - 0.03));
  g.add(box(0.03, 1.3, 0.04, trim, -0.46, 1.12, D / 2 - 0.03));
  g.add(box(0.03, 1.3, 0.04, trim, 0.2, 1.12, D / 2 - 0.03));

  // 右侧控制面板: 暂停服务小屏、按键阵列、投币口
  const side = kit.plain(0x2a2d2f, { roughness: 0.4, metalness: 0.5 });
  g.add(box(0.26, 1.3, 0.03, side, 0.35, 1.12, D / 2 - 0.02));
  const screenMat = ctx.disposer.track(new THREE.MeshBasicMaterial({ map: signTexture("暂停服务", "#ff5a3a", "#1a0605"), color: new THREE.Color(1.6, 1.6, 1.6) }));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.075), screenMat);
  screen.position.set(0.35, 1.55, D / 2 + 0.001);
  g.add(screen);
  const keyMat = kit.glow(0x6fd8ff, 1.3);
  for (let r = 0; r < 4; r += 1) for (let c = 0; c < 3; c += 1) g.add(box(0.04, 0.03, 0.01, keyMat, 0.29 + c * 0.06, 1.38 - r * 0.05, D / 2, { cast: false, receive: false }));
  g.add(box(0.06, 0.012, 0.012, kit.plain(0x0a0a0a), 0.35, 1.1, D / 2));
  g.add(box(0.7, 0.16, 0.05, kit.plain(0x0b0c0d, { roughness: 0.3 }), -0.1, 0.62, D / 2 - 0.02));

  // 顶部灯牌
  const signMat = ctx.disposer.track(new THREE.MeshBasicMaterial({ map: signTexture("冰爽饮品", "#dffaff", "#0b3a52"), color: new THREE.Color(1.8, 1.8, 1.8) }));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.2), signMat);
  sign.position.set(0, 1.82, D / 2 + 0.002);
  g.add(sign);

  // 滚落在地上的饮料罐
  const canColors = [0xc9362a, 0x3a86c9, 0xe0b233];
  for (let i = 0; i < 4; i += 1) {
    const can = cylinder(0.033, 0.033, 0.12, kit.plain(canColors[i % 3], { roughness: 0.3, metalness: 0.7 }), 12, -0.3 + ctx.rng() * 0.7, 0.033, D / 2 + 0.2 + ctx.rng() * 0.5);
    can.rotation.set(Math.PI / 2, 0, ctx.rng() * Math.PI);
    g.add(can);
  }

  // 光源: 投影聚光 + 冷色泛光
  const spot = new THREE.SpotLight(color, 14, 7, 1.15, 0.9, 2);
  spot.position.set(-0.1, 1.15, D / 2 + 0.12);
  spot.target.position.set(-0.1, 0, D / 2 + 2.8);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.camera.near = 0.1;
  spot.shadow.camera.far = 7;
  spot.shadow.bias = -0.0005;
  spot.shadow.normalBias = 0.03;
  spot.shadow.radius = 5;
  g.add(spot, spot.target);
  const fill = new THREE.PointLight(0x7fd4ff, 2.2, 4.5, 2);
  fill.position.set(0, 1.4, D / 2 + 0.5);
  g.add(fill);

  const seed = 4.2;
  ctx.animated.push({
    update: (t) => {
      const f = flickerValue("flicker", t, seed);
      spot.intensity = 14 * f;
      fill.intensity = 2.2 * f;
      panelMat.color.copy(color).multiplyScalar(0.2 + f * 1.9);
      signMat.color.setScalar(0.3 + f * 1.6);
      screenMat.color.setScalar(Math.floor(t * 1.6) % 2 ? 1.8 : 0.5);
    },
  });
  return g;
}
