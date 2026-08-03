// 过场原点是一次性的纯表现数据：不进入 store，也不参与可序列化的游戏状态。
// 触发方记录按钮点击位置，ScreenTransition 消费后立即清空，避免下一次切页误用旧坐标。

export interface TransitionOrigin {
  x: number;
  y: number;
}

let pendingOrigin: TransitionOrigin | null = null;

export function setTransitionOrigin(x: number, y: number): void {
  pendingOrigin = { x, y };
}

export function takeTransitionOrigin(): TransitionOrigin | null {
  const origin = pendingOrigin;
  pendingOrigin = null;
  return origin;
}