// 战斗背景素材集中登记处(与 enemyArt.ts 同思路: 静态 import + 登记表), 按 MapDef.id 作键。
// 数据层不碰素材(见 data/maps.ts 顶部注释), 故「地图 → 背景」的关联落在这里。
import forestBgVideo from "@/assets/战斗背景/森林.mp4";
import neonCityBg from "@/assets/战斗背景/霓虹城市.png";
import { preloadImage } from "@/ui/art/assetLoader";

// kind 决定 BattleScreen 渲染成 <video>(循环播放) 还是 <img>(静态图)。两者挂同一个
// .battle-bg-video 类与同一份相机变换 —— 该类名早于静态图存在, 现已不止承载视频, 保留原名
// 只为不惊动 ui/BattleScreen.css / animations.ts 里对它的多处引用。对场景相机而言二者完全等价。
export interface BattleBgDef {
  kind: "video" | "image";
  src: string;
}

const BATTLE_BG: Record<string, BattleBgDef> = {
  "neon-city": { kind: "image", src: neonCityBg },
};

// 未登记背景的地图回退到森林视频, 与登记表存在之前的行为一致。
const FALLBACK_BG: BattleBgDef = { kind: "video", src: forestBgVideo };

export const BATTLE_BG_IMAGE_SOURCES: readonly string[] = [...new Set(
  Object.values(BATTLE_BG)
    .filter((def) => def.kind === "image")
    .map((def) => def.src),
)];
export const BATTLE_BG_VIDEO_SOURCES: readonly string[] = [FALLBACK_BG.src];

export function battleBg(mapId: string | null): BattleBgDef {
  return (mapId && BATTLE_BG[mapId]) || FALLBACK_BG;
}

let warmed = false;

// 预热: 静态图远超 Vite 4KB 内联阈值(霓虹城市.png 约 1.3MB) → 独立请求, 不预热则进战斗
// 首帧只有 .screen.battle 的 #070a0c 兜底色。视频不在此列 —— 由 <video preload="auto"> 自理。
// 幂等, StrictMode 下 effect 双调用也安全(与 enemyArt.ts warmEnemyArt 同写法)。
export function warmBattleBg(): void {
  if (warmed) return;
  warmed = true;
  for (const src of BATTLE_BG_IMAGE_SOURCES) void preloadImage(src).catch(() => {});
}
