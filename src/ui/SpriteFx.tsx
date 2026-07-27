import type { SpritePreset } from "./animations";
import "./SpriteFx.css";

// 序列帧特效播放器。12 帧一次性堆叠挂载, 各帧靠 animation-delay 亮起自己的时间片,
// 与 SkillCutInCard 同源思路 —— 纯 CSS 驱动, 组件内不维护播放状态; 卸载即中止。
// 由 CombatantView 用 key={hit.seq} 强制重挂载来重放。
// 尺寸/位移/时序全部来自 ANIM 预设(见 animations.ts 的 SpritePreset), 此处只负责下发。
export function SpriteFx({ sprite }: { sprite: SpritePreset }) {
  return (
    <>
      {sprite.frames.map((src, i) => (
        <img
          key={i}
          className="vfx-frame"
          src={src}
          alt=""
          style={{
            width: `${sprite.width}px`,
            // 高度显式写死: 用 auto 的话图片加载完成前高度为 0, 下面的百分比位移会解析成 0 导致锚点错位
            height: `${sprite.height}px`,
            // 把帧内 anchorY 处的冲击点对到 .vfx 锚点, 水平居中
            transform: `translate(-50%, -${sprite.anchorY * 100}%)`,
            animationDelay: `${i * sprite.frameMs}ms`,
            // 多 8ms 与下一帧微重叠, 消除帧间断档闪烁(重叠期后一帧盖在前一帧上, 不会双重曝光)
            animationDuration: `${sprite.frameMs + 8}ms`,
          }}
        />
      ))}
    </>
  );
}
