import type { ExploreState } from "../types";

// 远征日志。只追加, 结算页与调试面板按时间顺序读取。
export function logLine(s: ExploreState, text: string): void {
  s.log.push(text);
}
