// 舱内演出的分镜时钟: 结果一出现就按固定时间轴推进分镜, CSS 与着色器都按同一份时间轴播放。
//   scan     扫描光带自上而下扫过舱内原卡
//   dissolve 原卡自上而下溶解成绿色数据流(复制不溶解)
//   form     新卡自下而上在舱内成形(删牌不成形)
//   settle   成形闪光 + 底座冲击环, 左侧卡位同步成结果
//   done     结论文字出现, 「完成」按钮可点
import { useEffect, useState } from "react";
import { playSfx } from "@/ui/audio";
import type { SfxId } from "@/ui/audio/sfx/sfxTypes";
import type { DeckServiceMode } from "./deckServiceModes";

export type ReplacePhase = "idle" | "scan" | "dissolve" | "form" | "settle" | "done";

/** 一段分镜的起止(毫秒, 相对演出开始); 不存在的段为 null。 */
export interface ChamberTimeline {
  scan: [number, number];
  dissolve: [number, number] | null;
  form: [number, number] | null;
  settle: [number, number];
  /** 整段时长, 到点进入 done。 */
  total: number;
}

const SCAN_MS = 700;
const DISSOLVE_MS = 1000;
const FORM_MS = 1100;
const SETTLE_MS = 520;

export function chamberTimeline(mode: DeckServiceMode): ChamberTimeline {
  let at = 0;
  const seg = (ms: number): [number, number] => [at, (at += ms)];
  const scan = seg(SCAN_MS);
  const dissolve = mode === "copy" ? null : seg(DISSOLVE_MS);
  const form = mode === "remove" ? null : seg(FORM_MS);
  const settle = seg(SETTLE_MS);
  return { scan, dissolve, form, settle, total: at };
}

const PHASE_SFX: Partial<Record<ReplacePhase, SfxId>> = {
  dissolve: "shatter",
  form: "cardDraw",
  settle: "cardSelect",
};

/** runKey 为 null 时停在 idle; 变为非空(本次服务的结果标识)即从 scan 开始完整播放一遍。 */
export function useReplaceSequence(runKey: string | null, mode: DeckServiceMode): ReplacePhase {
  const [phase, setPhase] = useState<ReplacePhase>(runKey ? "scan" : "idle");

  useEffect(() => {
    if (!runKey) {
      setPhase("idle");
      return;
    }
    const line = chamberTimeline(mode);
    const steps: { phase: ReplacePhase; at: number }[] = [];
    if (line.dissolve) steps.push({ phase: "dissolve", at: line.dissolve[0] });
    if (line.form) steps.push({ phase: "form", at: line.form[0] });
    steps.push({ phase: "settle", at: line.settle[0] }, { phase: "done", at: line.total });
    setPhase("scan");
    const timers = steps.map(({ phase: next, at }) => window.setTimeout(() => {
      setPhase(next);
      const sfx = PHASE_SFX[next];
      if (sfx) playSfx(sfx);
    }, at));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [runKey, mode]);

  return phase;
}
