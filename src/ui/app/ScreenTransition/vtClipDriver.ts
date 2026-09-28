// 逐帧驱动某个 View Transition 伪元素的 clip-path。
//
// 为什么不用 <html> 上的 CSS 自定义属性: 那是继承属性, 每帧改一次会让整棵新页面 DOM
// 重新算样式。这里改成对伪元素挂一条 WAAPI 动画、每帧 setKeyframes 换成当前形状 ——
// 只作用于那一个伪元素。
//
// ⚠ 这条动画的 duration 必须是有限值: VT 要等伪元素上所有动画播完才会 finished,
//   这里给的时长就参与决定整段过场何时结束。
// 伪元素要到 transition.ready 之后才存在, 在那之前 push 的形状先记着, attach 时补上。

export interface VtClipDriver {
  push(clip: string): void;
  attach(pseudoElement: string, durationMs: number, fallbackClip: string): void;
}

export function createVtClipDriver(): VtClipDriver {
  let latest: string | null = null;
  let effect: KeyframeEffect | null = null;
  return {
    push(clip) {
      latest = clip;
      effect?.setKeyframes({ clipPath: [clip, clip] });
    },
    attach(pseudoElement, durationMs, fallbackClip) {
      const clip = latest ?? fallbackClip;
      const animation = document.documentElement.animate(
        { clipPath: [clip, clip] },
        { duration: durationMs, fill: "both", pseudoElement },
      );
      effect = animation.effect instanceof KeyframeEffect ? animation.effect : null;
    },
  };
}
