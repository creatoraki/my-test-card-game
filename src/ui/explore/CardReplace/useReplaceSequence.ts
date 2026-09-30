// 置换演出的分镜时钟: 结果一出现就按固定时间轴推进分镜, CSS 只认 data-phase 播对应动画。
//   scan     扫描光带自上而下扫过原卡, 卡面充能发亮
//   collapse 原卡被压缩成一道横向数据线
//   reveal   数据线向上下展开成新卡, 伴随冲击环
//   settle   原卡以残影退到左侧、新卡移到右侧, 中间亮起箭头
//   done     结论文字出现, 「完成」按钮可点
import { useEffect, useState } from "react";
import { playSfx } from "@/ui/audio";

export type ReplacePhase = "idle" | "scan" | "collapse" | "reveal" | "settle" | "done";

const TIMELINE: { phase: ReplacePhase; at: number }[] = [
  { phase: "collapse", at: 820 },
  { phase: "reveal", at: 1380 },
  { phase: "settle", at: 2200 },
  { phase: "done", at: 2860 },
];

/** runKey 为 null 时停在 idle; 变为非空(本次置换的结果标识)即从 scan 开始完整播放一遍。 */
export function useReplaceSequence(runKey: string | null): ReplacePhase {
  const [phase, setPhase] = useState<ReplacePhase>(runKey ? "scan" : "idle");

  useEffect(() => {
    if (!runKey) {
      setPhase("idle");
      return;
    }
    setPhase("scan");
    const timers = TIMELINE.map(({ phase: next, at }) => window.setTimeout(() => {
      setPhase(next);
      if (next === "collapse") playSfx("shatter");
      if (next === "reveal") playSfx("cardDraw");
      if (next === "settle") playSfx("cardSelect");
    }, at));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [runKey]);

  return phase;
}
