// 重组过场的「飞行层」—— 一张绝对定位在画布内的卡片副本, 从 from 矩形连续形变到 to 矩形。
//
// ★ 为什么要副本而不是让真元素飞: 编队态的卡在网格里, 详情态的立绘栏在版面左侧, 两者是
//   **不同的 React 节点**, 换态时前者卸载后者挂载 —— 没有哪个真元素能横跨两态。副本是
//   FLIP 的标准解法: 起飞前把源元素藏起来, 落地时把目标元素亮出来, 中间这段由副本演。
// ⚠ 交接必须**瞬时**(不做交叉淡化): 副本落点与目标立绘栏是同一张图、同样的 cover 顶部取景、
//   同样的矩形 ⇒ 像素基本一致, 同一次提交里换掉看不出来; 叠一层淡化反而会露出两张图的差。
//
// ⚠ 这里直接动 left/top/width/height 而不是 transform: 卡是 276×772、立绘栏是 780×1080,
//   长宽比不同, 用 scale 会把人物拉扁。整个过场只有这一个元素在动, 逐帧重排代价可以接受。

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { MORPH_EASE, type Rect } from "./morphChoreo";
import s from "./MorphFlyer.module.css";

interface Props {
  characterId: string;
  emoji: string;
  name: string;
  color: string;
  from: Rect;
  to: Rect;
  /** 名字字号: 卡面 21px → 详情态 72px, 与两端的实际字号对齐。 */
  fromFontSize: number;
  toFontSize: number;
  /** 卡角圆角 16px → 出血立绘 0。 */
  fromRadius: number;
  toRadius: number;
  /** true = 回程(立绘 → 卡)。只影响顶部淡出遮罩的方向。 */
  reverse: boolean;
  ms: number;
  onDone: () => void;
}

const box = (rect: Rect): Record<string, string> => ({
  left: `${rect.x}px`,
  top: `${rect.y}px`,
  width: `${rect.w}px`,
  height: `${rect.h}px`,
});

export function MorphFlyer({
  characterId,
  emoji,
  name,
  color,
  from,
  to,
  fromFontSize,
  toFontSize,
  fromRadius,
  toRadius,
  reverse,
  ms,
  onDone,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const fadeRef = useRef<HTMLSpanElement>(null);
  // onDone 放进 ref: 它每次渲染都是新函数, 进依赖数组会让动画被反复重建。
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    // 「减少动态效果」: 时长已被 morphChoreo 归零 ⇒ 不起动画, 直接交接。
    if (ms <= 0 || typeof shell.animate !== "function") {
      const timer = window.setTimeout(() => doneRef.current(), 0);
      return () => window.clearTimeout(timer);
    }

    const options: KeyframeAnimationOptions = { duration: ms, easing: MORPH_EASE, fill: "both" };
    const shellAnim = shell.animate(
      [
        { ...box(from), borderRadius: `${fromRadius}px` },
        { ...box(to), borderRadius: `${toRadius}px` },
      ],
      options,
    );
    const nameAnim = nameRef.current?.animate(
      [{ fontSize: `${fromFontSize}px` }, { fontSize: `${toFontSize}px` }],
      options,
    );
    // 顶部淡出遮罩跟着一起长出来: 详情态的立绘顶到画布上边缘, 靠这道白纱才不会顶穿常驻顶带。
    // ⚠ 卡面上没有这道纱, 所以它必须**在飞行途中渐显**, 落地那一刻正好与 FigureStage 对齐 ——
    //   否则交接时会看到顶部忽然亮一块。
    const fadeAnim = fadeRef.current?.animate(
      reverse ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }],
      options,
    );

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      doneRef.current();
    };
    shellAnim.addEventListener("finish", finish);
    // 兜底: 标签页在动画期间被切走时 finish 事件可能迟到, 超时后照样交接。
    const guard = window.setTimeout(finish, ms + 120);

    return () => {
      window.clearTimeout(guard);
      shellAnim.cancel();
      nameAnim?.cancel();
      fadeAnim?.cancel();
    };
  }, [from, to, fromFontSize, toFontSize, fromRadius, toRadius, reverse, ms]);

  return (
    <div
      className={s.flyer}
      ref={shellRef}
      style={{ ...box(from), borderRadius: `${fromRadius}px`, "--gc-color": color } as CSSProperties}
      aria-hidden
    >
      <CharacterPortrait characterId={characterId} emoji={emoji} alt={name} className={s.portrait} />
      <span className={s["fade-top"]} ref={fadeRef} style={{ opacity: reverse ? 1 : 0 }} />
      <span className={s.scrim} />
      <span className={s.name} ref={nameRef} style={{ fontSize: `${fromFontSize}px` }}>
        {name}
      </span>
    </div>
  );
}
