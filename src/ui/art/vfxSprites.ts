// 序列帧特效素材集中登记处(与 cardArt.ts 同思路: 静态 import + 登记表)。
// 新增一套序列帧特效时只需在此登记一次, 再到 animations.ts 的 ANIM 里引用。
import f00 from "../assets/特效/魔剑坠落/0006_00.png";
import f01 from "../assets/特效/魔剑坠落/0006_01.png";
import f02 from "../assets/特效/魔剑坠落/0006_02.png";
import f03 from "../assets/特效/魔剑坠落/0006_03.png";
import f04 from "../assets/特效/魔剑坠落/0006_04.png";
import f05 from "../assets/特效/魔剑坠落/0006_05.png";
import f06 from "../assets/特效/魔剑坠落/0006_06.png";
import f07 from "../assets/特效/魔剑坠落/0006_07.png";
import f08 from "../assets/特效/魔剑坠落/0006_08.png";
import f09 from "../assets/特效/魔剑坠落/0006_09.png";
import f10 from "../assets/特效/魔剑坠落/0006_10.png";
import f11 from "../assets/特效/魔剑坠落/0006_11.png";

// 魔剑坠落: 12 帧, 每帧 243×583(竖长)。
// 构图: 00-02 凝聚 → 03-05 下坠砸地爆发 → 06-11 消散。冲击点在帧内纵向约 82% 处。
export const SWORD_FALL_FRAMES: readonly string[] = [
  f00, f01, f02, f03, f04, f05, f06, f07, f08, f09, f10, f11,
];

// 全部序列帧素材(预热用)。新增特效时把新的帧数组并进来。
const ALL_SPRITE_FRAMES: readonly string[] = [...SWORD_FALL_FRAMES];

const held: HTMLImageElement[] = []; // 持有引用, 避免解码结果被 GC
let warmed = false;

// 预热: 12 帧共约 425KB, 均超 Vite 4KB 内联阈值 → 会是 12 个独立请求,
// 不预热首次出剑必然逐帧闪。幂等, StrictMode 下 effect 双调用也安全。
export function warmVfxSprites(): void {
  if (warmed) return;
  warmed = true;
  for (const src of ALL_SPRITE_FRAMES) {
    const img = new Image();
    img.src = src;
    void img.decode().catch(() => {}); // 解码失败不阻断后续播放
    held.push(img);
  }
}
