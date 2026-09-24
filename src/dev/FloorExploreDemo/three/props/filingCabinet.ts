import * as THREE from "three";
import { box } from "../core/geometryUtils";
import { PALETTE } from "../materials/materialKit";
import type { BuildContext } from "../room/buildContext";

const W = 0.46;
const H = 1.33;
const D = 0.62;
const DRAWERS = 4;

/** 一只四斗铁皮档案柜。pulled[i] 为第 i 层抽屉拉出的距离。 */
function cabinet(ctx: BuildContext, tint: number, pulled: number[]): THREE.Group {
  const g = new THREE.Group();
  const { kit } = ctx;
  const body = kit.surface("metal", { color: tint, metalness: 0.45, roughness: 1, bumpScale: 0.7 });
  const dark = kit.plain(0x141617, { roughness: 0.9 });
  const handle = kit.plain(0xb8bcbd, { roughness: 0.25, metalness: 0.9 });
  const label = kit.plain(0xd9d4c4, { roughness: 0.8 });
  const paper = kit.plain(PALETTE.paper, { roughness: 0.9 });
  // 外壳: 顶、底、两侧、背板, 前面留给抽屉
  g.add(box(W, 0.02, D, body, 0, H - 0.01, 0));
  g.add(box(W, 0.05, D, body, 0, 0.025, 0));
  for (const s of [-1, 1]) g.add(box(0.02, H, D, body, s * (W / 2 - 0.01), H / 2, 0));
  g.add(box(W, H, 0.02, body, 0, H / 2, -D / 2 + 0.01));
  const slot = (H - 0.07) / DRAWERS;
  for (let i = 0; i < DRAWERS; i += 1) {
    const y = 0.05 + slot * (i + 0.5);
    const out = pulled[i] ?? 0;
    const drawer = new THREE.Group();
    drawer.position.set(0, y, D / 2 - 0.01 + out);
    drawer.add(box(W - 0.03, slot - 0.012, 0.02, body, 0, 0, 0));
    drawer.add(box(0.16, 0.025, 0.03, handle, 0, -0.03, 0.02));
    drawer.add(box(0.09, 0.045, 0.004, label, 0, 0.06, 0.012, { cast: false }));
    if (out > 0.05) {
      // 拉出的抽屉: 露出的侧板 + 里面翘起的文件
      for (const s of [-1, 1]) drawer.add(box(0.01, slot * 0.7, out, dark, s * (W / 2 - 0.03), -0.02, -out / 2));
      for (let k = 0; k < 5; k += 1) {
        const sheet = box(W - 0.08, 0.004, 0.22, paper, (ctx.rng() - 0.5) * 0.05, 0.02 + k * 0.01, -out / 2 + (ctx.rng() - 0.5) * 0.1);
        sheet.rotation.x = -1.2 + ctx.rng() * 0.4;
        drawer.add(sheet);
      }
    }
    g.add(drawer);
    // 抽屉缝的阴影线
    g.add(box(W - 0.03, 0.006, 0.01, dark, 0, y + slot / 2 - 0.003, D / 2 - 0.02, { cast: false }));
  }
  return g;
}

/**
 * 翻倒的档案柜组: 两只靠墙站着(一只抽屉被拉开、一只歪斜), 第三只侧翻在前面,
 * 地上撒着文件夹。本地 -z 贴墙, +z 朝房间。
 */
export function buildFilingCabinet(ctx: BuildContext): THREE.Group {
  const g = new THREE.Group();
  const a = cabinet(ctx, PALETTE.cabinet, [0, 0.34, 0, 0.12]);
  a.position.set(-0.42, 0, -0.43);
  g.add(a);
  const b = cabinet(ctx, 0x847f72, [0.22, 0, 0, 0]);
  b.position.set(0.1, 0, -0.44);
  b.rotation.set(0, -0.06, -0.035);
  g.add(b);
  const c = cabinet(ctx, PALETTE.cabinetGreen, [0, 0.2, 0, 0]);
  c.rotation.set(0, 0.18, Math.PI / 2);
  c.position.set(0.66, W / 2 - 0.005, 0.36);
  g.add(c);
  const folderColors = [0xd0b36a, 0x6e8aa6, 0xc9c4b4];
  for (let i = 0; i < 9; i += 1) {
    const folder = box(0.24, 0.006, 0.32, ctx.kit.plain(folderColors[i % 3], { roughness: 0.85 }), -0.4 + ctx.rng() * 0.9, 0.004 + i * 0.001, 0.05 + ctx.rng() * 0.6, { cast: false });
    folder.rotation.y = ctx.rng() * Math.PI;
    g.add(folder);
  }
  return g;
}
