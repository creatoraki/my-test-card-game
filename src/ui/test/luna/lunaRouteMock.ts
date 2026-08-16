import { generateSegments } from "@/explore/route";
import type { NodeEvent, NodeEventKind, RouteBoard } from "@/explore/types";

type EventSpec = {
  kind: NodeEventKind;
  title: string;
  description: string;
  energyDelta: number;
};

const EVENT_POOL: EventSpec[] = [
  { kind: "loot", title: "月尘回收箱", description: "箱体还在滴水，封条内侧留着上一支队伍的编号。", energyDelta: -1 },
  { kind: "heal", title: "低温修复舱", description: "一束柔白的维护光仍在舱内循环。", energyDelta: -2 },
  { kind: "merchant", title: "静默交易台", description: "没有店员，只有一枚等待确认的报价。", energyDelta: 0 },
  { kind: "route", title: "轨道分配器", description: "旧式分流盘卡在中间位置，似乎还能工作一次。", energyDelta: -1 },
  { kind: "energy", title: "微光电池", description: "外壳发热，内部还保存着少量净化粒子。", energyDelta: 3 },
  { kind: "hazard", title: "裂开的观测窗", description: "风压从缝隙里倒灌，靠近它并不明智。", energyDelta: -3 },
  { kind: "battle", title: "无声巡逻体", description: "它没有发出警报，却已经把镜头转向了你。", energyDelta: -2 },
  { kind: "retreat", title: "返回升降梯", description: "若现在离开，收集到的月尘仍能安全带回。", energyDelta: 0 },
];

function nextRandom(state: { value: number }): number {
  state.value = (state.value * 1664525 + 1013904223) >>> 0;
  return state.value;
}

function pickEvent(state: { value: number }, segment: number, lane: number): NodeEvent {
  const spec = EVENT_POOL[nextRandom(state) % EVENT_POOL.length];
  const risk = segment >= 2 && (spec.kind === "hazard" || spec.kind === "battle")
    ? spec.kind === "hazard" ? "negative" : "highRisk"
    : undefined;
  return {
    id: `luna-${segment}-${lane}-${nextRandom(state) % 10000}`,
    kind: spec.kind,
    category: spec.kind === "hazard" || spec.kind === "battle" ? "hazard" : "growth",
    risk,
    title: spec.title,
    description: spec.description,
    energyDelta: spec.energyDelta,
  };
}

export function makeLunaBoard(round: number): RouteBoard {
  const random = { value: ((round * 2654435761) >>> 0) || 1 };
  const laneCount = 5;
  const rowsPerSegment = 4;
  const segments = generateSegments(random, laneCount, rowsPerSegment, [1, 2, 2, 3]);
  const nodes = Array.from({ length: 4 }, (_, segment) =>
    Array.from({ length: laneCount }, (_, lane) => pickEvent(random, segment, lane)),
  );
  return {
    round,
    laneCount,
    rowsPerSegment,
    segments,
    nodes,
    revealDurationMs: 2400,
    blockedLanes: [4],
  };
}