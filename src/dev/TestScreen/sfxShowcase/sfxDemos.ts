// 攻击音效试听: 两种生成模式 × 三个特效。每个 demo 拆成「施放」(特效挂载起播)与
// 「爆点」(impactMs 起播)两段, 正式接入战斗时分别对应 animSfx 的 attack / impact 两条 cue。

import { playSfxRecipe, playSfxSample, preloadSfxSample } from "@/ui/audio";
import { BAKED_SAMPLES } from "./bakedSamples";
import { REALTIME_RECIPES } from "./realtimeRecipes";

export type DemoMode = "realtime" | "baked";
export type DemoAnim = keyof typeof REALTIME_RECIPES;

export const DEMO_MODES: readonly { mode: DemoMode; name: string; note: string }[] = [
  { mode: "realtime", name: "实时合成", note: "网页音频分层配方，零音频文件；两倍速时整段压缩、音高不变" },
  { mode: "baked", name: "离线烘焙", note: "脚本渲染成音频文件，含混响、饱和、立体声声像；两倍速时整体升调" },
];

export const DEMO_ANIMS: readonly { anim: DemoAnim; name: string; note: string }[] = [
  { anim: "tri-slash", name: "三段斩击", note: "V 形两刀 · 十连斩 · 静默后爆裂" },
  { anim: "neon-cross", name: "霓虹交叉斩", note: "扫描锁定 · 双刃交叉 · 像素崩解" },
  { anim: "fire", name: "灼烧", note: "火星旋聚 · 爆燃 · 余烬噼啪" },
];

// 离线版随倍速升调: 采样没法只压时长不变音高, 这正是两种模式要对比的取舍之一。
export function playDemoPart(mode: DemoMode, anim: DemoAnim, part: "cast" | "hit", rate: number): void {
  if (mode === "realtime") playSfxRecipe(REALTIME_RECIPES[anim][part], { rate });
  else playSfxSample(BAKED_SAMPLES[anim][part], { pitch: rate });
}

export function preloadBakedDemos(): void {
  for (const { cast, hit } of Object.values(BAKED_SAMPLES)) {
    preloadSfxSample(cast);
    preloadSfxSample(hit);
  }
}
