// 地图预览图集中登记处(与 battleBg.ts / enemyArt.ts 同思路: 静态 import + 登记表), 按 MapDef.id 作键。
// 数据层不碰素材(见 data/maps.ts 顶部注释), 故「地图 → 预览图」的关联落在这里。
//
// ⚠ 与 battleBg.ts 的分工: 那边是**战斗背景**(打起来时铺满屏幕的那张), 这边是**选层时的缩略预览**。
//   同一张地图两者可以是不同的图, 故刻意分成两张表而不是给 BattleBgDef 加字段。
import ruinedFloorArt from "@/assets/场景/大楼废弃楼层.png";
import { preloadImage } from "@/ui/art/assetLoader";

const MAP_ART: Record<string, string> = {
  // 废弃楼层 = 废弃大楼内部, 与这张等距废弃楼层图最贴。
  "neon-city": ruinedFloorArt,
};

// 目前只有一张场景图, 未登记的地图先共用它 —— 有了各自的图再往上表里加行。
const FALLBACK_ART = ruinedFloorArt;

export const MAP_ART_SOURCES: readonly string[] = [...new Set([
  ...Object.values(MAP_ART),
  FALLBACK_ART,
])];

export function mapArt(mapId: string): string {
  return MAP_ART[mapId] ?? FALLBACK_ART;
}

let warmed = false;

// 预热: 大楼废弃楼层.png 约 3.4MB, 远超 Vite 内联阈值 ⇒ 独立请求。不预热的话点开下降舱那一刻
// 预览位是一片空底色。幂等, StrictMode 下 effect 双调用也安全(与 warmBattleBg / warmFacilityBg 同写法)。
export function warmMapArt(): void {
  if (warmed) return;
  warmed = true;
  for (const src of MAP_ART_SOURCES) void preloadImage(src).catch(() => {});
}
