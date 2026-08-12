// 战斗背景素材集中登记处(与 enemyArt.ts 同思路: 静态 import + 登记表), 按 MapDef.id 作键。
// 数据层不碰素材(见 data/maps.ts 顶部注释), 故「地图 → 背景」的关联落在这里。
import neonCityBg from "@/assets/战斗背景/霓虹城市.png";
import { preloadImage } from "@/ui/art/assetLoader";

// 战斗背景现在只渲染静态图。.battle-bg-video 是历史遗留类名, 仍被
// BattleScreen.module.css / animations.ts 多处引用, 故保持不动。
const BATTLE_BG: Record<string, string> = {
  "neon-city": neonCityBg,
};

// 未登记的地图回退到霓虹城市。
const FALLBACK_BG = neonCityBg;

export const BATTLE_BG_IMAGE_SOURCES: readonly string[] = [...new Set(
  [...Object.values(BATTLE_BG), FALLBACK_BG],
)];

export function battleBg(mapId: string | null): string {
  return (mapId && BATTLE_BG[mapId]) || FALLBACK_BG;
}

let warmed = false;

// 预热: 静态图远超 Vite 4KB 内联阈值(霓虹城市.png 约 1.3MB) → 独立请求, 不预热则进战斗
// 首帧只有 .screen.battle 的 #070a0c 兜底色。
// 幂等, StrictMode 下 effect 双调用也安全(与 enemyArt.ts warmEnemyArt 同写法)。
export function warmBattleBg(): void {
  if (warmed) return;
  warmed = true;
  for (const src of BATTLE_BG_IMAGE_SOURCES) void preloadImage(src).catch(() => {});
}
