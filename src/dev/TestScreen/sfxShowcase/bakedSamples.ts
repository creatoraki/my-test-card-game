// 离线烘焙版攻击音效: 由 scripts/sfx-bake/bake.mjs 渲染(混响/饱和/比特破碎/立体声声像),
// 改音色改那边的配方后重新执行脚本即可覆盖这些 wav。
import type { SfxSample } from "@/ui/audio";
import neonCast from "@/assets/sounds/音效/烘焙/霓虹交叉斩-施放.wav";
import neonHit from "@/assets/sounds/音效/烘焙/霓虹交叉斩-爆点.wav";
import fireCast from "@/assets/sounds/音效/烘焙/灼烧-施放.wav";
import fireHit from "@/assets/sounds/音效/烘焙/灼烧-爆点.wav";

// 施放段整体比爆点段低约 10dB(蓄势 vs 冲击), 增益略抬一点补回。
const cast = (src: string): SfxSample => ({ srcs: [src], gain: 0.6 });
const hit = (src: string): SfxSample => ({ srcs: [src], gain: 0.5 });

export const BAKED_SAMPLES = {
  "neon-cross": { cast: cast(neonCast), hit: hit(neonHit) },
  fire: { cast: cast(fireCast), hit: hit(fireHit) },
} as const;
