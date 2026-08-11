import type { EnemySpriteDef } from "@/ui/art/enemyArt";
import s from "./EnemySprite.module.css";

// 敌人待机立绘播放器: 单张横向拼条, 靠 background-position 无限循环。
// 与 SpriteFx 同源思路 —— 纯 CSS 驱动, 组件内不维护播放状态; 尺寸/时序全部来自
// enemyArt.ts 的登记表, 此处只负责下发。
//
// 不用 steps(n) 线性推进, 而是为每个实播帧生成一个显式落点的 @keyframes + step-end:
// steps() 只能等距连续遍历整条 strip, 没法跳掉中间的坏帧(见 skipFrames)。仍坚持 CSS
// 驱动而非 JS 定时器, 是为了保住 EnemySprite.module.css 里 [data-dead] / [data-hitstop]
// 那两条 animation-play-state（尸体停振翅、顿帧冻住待机）。
export function EnemySprite({
  id,
  sprite,
  alt,
  scale = 1,
}: {
  id: string; // enemyDefId; 用来隔离各敌人的 keyframes 名, 避免同名互相覆盖
  sprite: EnemySpriteDef;
  alt: string;
  scale?: number;
}) {
  const skip = new Set(sprite.skipFrames ?? []);
  // 实播帧序列(0-based 索引); skipFrames 是 1-based, 故按 i+1 过滤
  const play = Array.from({ length: sprite.frames }, (_, i) => i).filter((i) => !skip.has(i + 1));
  const { box } = sprite;
  // k 把源图像素换算为屏幕像素: 内容框正好落入 width × height, scale 再作用于整张立绘。
  const k = (sprite.width / box.w) * scale;
  const name = `enemySpriteIdle-${id}-${String(scale).replace(".", "_")}`;

  const offset = (frame: number) => `${-(box.x + frame * box.w) * k}px`;
  // 每帧在 i/n 处落一个位置, step-end 让它原地停到下一个落点; 末尾补 100%(值同末帧),
  // 使末帧也占满自己那一格时长
  const stops = play
    .map((f, i) => `${((i * 100) / play.length).toFixed(3)}%{background-position-x:${offset(f)}}`)
    .join("");
  const css = `@keyframes ${name}{${stops}100%{background-position-x:${offset(play[play.length - 1])}}}`;

  return (
    <>
      <style>{css}</style>
      <div
        className={s["enemy-sprite"]}
        role="img"
        aria-label={alt}
        style={{
          width: `${sprite.width * scale}px`,
          height: `${sprite.height * scale}px`,
          backgroundImage: `url(${sprite.src})`,
          // 整张源图缩放后, 内容框通过位置偏移落到元素左上角, 元素外部自然被裁掉。
          backgroundSize: `${box.sw * k}px ${box.sh * k}px`,
          backgroundPositionY: `${-box.y * k}px`,
          animationName: name,
          animationTimingFunction: "step-end",
          animationDuration: `calc(${play.length * sprite.frameMs}ms / max(var(--fx-rate, 1), 0.25))`,
        }}
      />
    </>
  );
}
