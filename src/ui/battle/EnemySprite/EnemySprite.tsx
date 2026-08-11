import { useInsertionEffect } from "react";
import type { EnemySpriteDef } from "@/ui/art/enemyArt";
import s from "./EnemySprite.module.css";

const KEYFRAME_STYLES = new Map<string, { element: HTMLStyleElement; refs: number }>();

function retainKeyframes(id: string, css: string): () => void {
  const current = KEYFRAME_STYLES.get(id);
  if (current) {
    current.refs += 1;
  } else {
    const element = document.createElement("style");
    element.dataset.enemySprite = id;
    element.textContent = css;
    document.head.appendChild(element);
    KEYFRAME_STYLES.set(id, { element, refs: 1 });
  }

  return () => {
    const entry = KEYFRAME_STYLES.get(id);
    if (!entry) return;
    entry.refs -= 1;
    if (entry.refs > 0) return;
    entry.element.remove();
    KEYFRAME_STYLES.delete(id);
  };
}

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
  flip,
}: {
  id: string; // enemyDefId; 用来隔离各敌人的 keyframes 名, 避免同名互相覆盖
  sprite: EnemySpriteDef;
  alt: string;
  flip?: boolean; // 左右镜像(见 data/encounters.ts 的 EnemyPlacement.flip)
}) {
  const skip = new Set(sprite.skipFrames ?? []);
  // 实播帧序列(0-based 索引); skipFrames 是 1-based, 故按 i+1 过滤
  const play = Array.from({ length: sprite.frames }, (_, i) => i).filter((i) => !skip.has(i + 1));
  const view = sprite.view ?? {
    x: 0,
    y: 0,
    w: sprite.sheet.w / sprite.frames,
    h: sprite.sheet.h,
  };
  const name = `enemySpriteIdle-${id}`;

  const offset = (frame: number) => `calc(var(--sprite-k) * ${-(view.x + frame * view.w)})`;
  // 每帧在 i/n 处落一个位置, step-end 让它原地停到下一个落点; 末尾补 100%(值同末帧),
  // 使末帧也占满自己那一格时长
  const stops = play
    .map((f, i) => `${((i * 100) / play.length).toFixed(3)}%{background-position-x:${offset(f)}}`)
    .join("");
  const css = `@keyframes ${name}{${stops}100%{background-position-x:${offset(play[play.length - 1])}}}`;

  useInsertionEffect(() => {
    return retainKeyframes(id, css);
  }, [css, id]);

  return (
    <div
      className={s["enemy-sprite"]}
      role="img"
      aria-label={alt}
      style={{
        width: "var(--fig-w)",
        height: "var(--fig-h)",
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `calc(var(--sprite-k) * ${sprite.sheet.w}) calc(var(--sprite-k) * ${sprite.sheet.h})`,
        backgroundPositionY: `calc(var(--sprite-k) * ${-view.y})`,
        // 镜像只翻这一层: 本元素的 transform 没有被任何动画占用(待机呼吸挂在
        // .combatant-figure, 拼条循环走 background-position), 故不会被覆盖;
        // 翻在这里也不会带上血条/意图/命中特效。
        transform: flip ? "scaleX(-1)" : undefined,
        animationName: name,
        animationTimingFunction: "step-end",
        animationDuration: `calc(${play.length * sprite.frameMs}ms / max(var(--fx-rate, 1), 0.25))`,
      }}
    />
  );
}
