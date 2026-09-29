// 攻击音效离线烘焙: node scripts/sfx-bake/bake.mjs
// 每个特效输出两段: 「施放」从特效挂载起播、「爆点」在 impactMs 起播(多段伤害时逐段重复)。
// 同一特效的两段共用一个归一化系数, 保留二者的相对响度。
import fs from "node:fs";
import path from "node:path";
import { fadeEdges, peakOf, scale } from "./dsp.mjs";
import { encodeWav } from "./wav.mjs";
import * as triSlash from "./recipes/triSlash.mjs";
import * as neonCross from "./recipes/neonCross.mjs";
import * as fire from "./recipes/fire.mjs";

const OUT_DIR = path.resolve("src/assets/sounds/音效/烘焙");
const PEAK = 0.89; // ≈ -1 dBFS

const RECIPES = [
  { name: "三段斩击", recipe: triSlash },
  { name: "霓虹交叉斩", recipe: neonCross },
  { name: "灼烧", recipe: fire },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const { name, recipe } of RECIPES) {
  const started = Date.now();
  const cast = recipe.cast();
  const hit = recipe.hit();
  const gain = PEAK / Math.max(1e-6, peakOf(cast, hit));
  for (const [part, bus] of [["施放", cast], ["爆点", hit]]) {
    scale(bus, gain);
    fadeEdges(bus);
    const file = path.join(OUT_DIR, `${name}-${part}.wav`);
    fs.writeFileSync(file, encodeWav(bus));
    console.log(`${path.relative(process.cwd(), file)}  ${(bus.L.length / 44.1).toFixed(0)}ms`);
  }
  console.log(`  ${name} 完成, 归一化增益 ${gain.toFixed(2)}, 用时 ${Date.now() - started}ms`);
}
