// 路线图组件的**预览用假数据** —— 只服务 src/ui/test/opus 下的样式验收页, 不进产线。
// ⚠ 图形结构(桥接生成 / 段内双射)直接复用 explore/route.ts 的真实生成器,
//   这样预览页看到的构图与实际跑起来的一致; 这里额外补的只有「节点事件的文案与类型」。

import { generateSegments } from "@/explore/route";
import type { NodeEvent, NodeEventKind, RouteBoard } from "@/explore/types";

interface EventSpec {
  kind: NodeEventKind;
  title: string;
  desc: string;
  energy: number;
}

// 每种事件给两三条文案, 抽到同一 kind 时标题不会全场重复。
const POOL: EventSpec[] = [
  { kind: "loot", title: "废弃货柜", desc: "半塌的货架间还压着没被搬空的补给箱。", energy: -1 },
  { kind: "loot", title: "遗留物资点", desc: "上一支小队留下的标记, 东西大概还在。", energy: -1 },
  { kind: "heal", title: "野战医疗位", desc: "接通电源后仍可运转的简易治疗舱。", energy: -2 },
  { kind: "heal", title: "净水管口", desc: "过滤层尚未失效, 可短暂休整。", energy: -2 },
  { kind: "merchant", title: "交易终端", desc: "自动售货机的屏幕还亮着, 愿意做生意。", energy: 0 },
  { kind: "route", title: "线路分配器", desc: "改写下一段的走向, 但代价未知。", energy: -1 },
  { kind: "energy", title: "净化滤芯", desc: "回收还能用的滤芯, 直接补充净化粒子。", energy: 4 },
  { kind: "energy", title: "备用电池组", desc: "电量不多, 但足够撑过一段推进。", energy: 3 },
  { kind: "hazard", title: "压力门夹层", desc: "结构随时可能塌落, 通过要付出代价。", energy: -3 },
  { kind: "hazard", title: "污染回流区", desc: "浓度超标, 停留越久损耗越大。", energy: -4 },
  { kind: "battle", title: "游荡个体", desc: "它已经注意到这条通道上的动静。", energy: -2 },
  { kind: "retreat", title: "应急货梯", desc: "可以就此收工, 把收益带回据点。", energy: 0 },
];

function pick(state: { rngState: number }, seg: number): NodeEvent {
  state.rngState = (state.rngState * 1664525 + 1013904223) >>> 0;
  const spec = POOL[state.rngState % POOL.length];
  // 风险标记只出现在第 3-4 推进段(与设计文档 §2.3.2 一致), 预览页照抄这条约束才看得出层次。
  const risky = seg >= 2 && (spec.kind === "hazard" || spec.kind === "battle");
  return {
    id: `mock-${seg}-${state.rngState % 9973}`,
    kind: spec.kind,
    category: "growth",
    risk: risky ? (spec.kind === "hazard" ? "negative" : "highRisk") : undefined,
    title: spec.title,
    description: spec.desc,
    energyDelta: spec.energy,
  };
}

export function makeMockBoard(seed: number): RouteBoard {
  const rng = { rngState: (seed * 2654435761) >>> 0 || 1 };
  const laneCount = 5;
  const rowsPerSegment = 4;
  const segments = generateSegments(rng, laneCount, rowsPerSegment, [1, 2, 2, 3]);
  const nodes: NodeEvent[][] = Array.from({ length: 4 }, (_, seg) =>
    Array.from({ length: laneCount }, () => pick(rng, seg)),
  );
  return {
    round: seed,
    laneCount,
    rowsPerSegment,
    segments,
    nodes,
    revealDurationMs: 2600,
    blockedLanes: seed % 3 === 0 ? [3] : [],
    hiddenNodes: [],
  };
}
