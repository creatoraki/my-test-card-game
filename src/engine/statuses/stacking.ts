import type { RefreshMode, StatusDef, StatusInstance, StatusSegment } from "../types";

function segmentDuration(segment: StatusSegment): number {
  return segment.duration ?? Number.POSITIVE_INFINITY;
}

export function syncSegments(inst: StatusInstance): void {
  const segments = inst.segments ?? [];
  inst.stacks = segments.reduce((sum, segment) => sum + segment.stacks, 0);
  if (segments.length === 0 || segments.some((segment) => segment.duration == null)) {
    delete inst.duration;
  } else {
    inst.duration = Math.max(...segments.map((segment) => segment.duration!));
  }
}

function mergeDuration(inst: StatusInstance, duration: number | undefined, mode: RefreshMode): void {
  if (mode === "keep") return;
  if (mode === "override") {
    if (duration == null) delete inst.duration;
    else inst.duration = duration;
    return;
  }
  if (duration != null && inst.duration != null)
    inst.duration = Math.max(inst.duration, duration);
}

function removeSegmentStacks(inst: StatusInstance, stacks: number): void {
  const segments = inst.segments ?? [];
  let remaining = stacks;
  for (const segment of segments) {
    if (remaining <= 0) break;
    const removed = Math.min(segment.stacks, remaining);
    segment.stacks -= removed;
    remaining -= removed;
  }
  inst.segments = segments.filter((segment) => segment.stacks > 0);
}

// 从状态实例上移除指定层数(分段状态按段扣减), 返回实际移除的层数。
export function reduceStatusStacks(inst: StatusInstance, amount: number): number {
  const removed = Math.min(inst.stacks, Math.max(0, Math.floor(amount)));
  if (removed <= 0) return 0;
  if (inst.segments) {
    removeSegmentStacks(inst, removed);
    syncSegments(inst);
  } else {
    inst.stacks -= removed;
  }
  return removed;
}

export function newSegment(stacks: number, duration: number | undefined, tempo: number, growth?: number): StatusSegment {
  return {
    stacks,
    ...(duration != null ? { duration } : {}),
    appliedAt: tempo,
    ...(growth ? { growth } : {}),
  };
}

// 菌毒: 带 growth 的分段每结算一次(含毒发)层数增加。
export function growSegments(inst: StatusInstance): void {
  if (!inst.segments?.some((segment) => segment.growth)) return;
  for (const segment of inst.segments) if (segment.growth) segment.stacks += segment.growth;
  syncSegments(inst);
}

export function mergeStatus(
  inst: StatusInstance,
  def: StatusDef,
  stacks: number,
  duration: number | undefined,
  tempo: number,
  growth?: number,
): void {
  const stackMode = def.stackMode ?? "add";
  if (stackMode === "segments") {
    const segments = (inst.segments ??= inst.stacks > 0
      ? [{ stacks: inst.stacks, duration: inst.duration, appliedAt: inst.appliedAt ?? tempo }]
      : []);
    if (stacks > 0) segments.push(newSegment(stacks, duration, tempo, growth));
    else if (stacks < 0) removeSegmentStacks(inst, -stacks);
    inst.appliedAt = tempo;
    syncSegments(inst);
    return;
  }

  if (stacks < 0) inst.stacks += stacks;
  else if (stackMode === "max") inst.stacks = Math.max(inst.stacks, stacks);
  else inst.stacks += stacks;
  mergeDuration(inst, duration, def.refreshMode ?? "max");
  inst.appliedAt = tempo;
}

export function effectiveStacks(inst: StatusInstance, def: StatusDef, tempo: number): number {
  if (def.stackMode === "segments") {
    if (!inst.segments) return inst.stacks;
    return inst.segments.reduce((sum, segment) => sum + segment.stacks, 0);
  }
  return inst.appliedAt === tempo ? 0 : inst.stacks;
}

// 推进一拍。返回本拍自然到期的分段(仅分段状态; 衔尾蛇据此转化 DOT)。
export function tickStatus(inst: StatusInstance, def: StatusDef, tempo?: number): StatusSegment[] {
  if (def.stackMode === "segments") {
    if (!inst.segments) {
      if (def.decay === "one") inst.stacks -= 1;
      if (def.decay === "half") inst.stacks = Math.floor(inst.stacks / 2);
      if (inst.duration != null) inst.duration -= 1;
      return inst.duration != null && inst.duration <= 0 && inst.stacks > 0
        ? [{ stacks: inst.stacks, duration: 0, appliedAt: inst.appliedAt ?? 0 }]
        : [];
    }
    for (const segment of inst.segments) {
      if (segment.duration != null) segment.duration -= 1;
    }
    const expired = inst.segments.filter((segment) => segment.duration != null && segment.duration <= 0);
    inst.segments = inst.segments.filter((segment) => segment.duration == null || segment.duration > 0);
    syncSegments(inst);
    return expired;
  }

  if (tempo != null && inst.appliedAt === tempo && !def.durationStartsImmediately) return [];
  if (def.decay === "one") inst.stacks -= 1;
  if (def.decay === "half") inst.stacks = Math.floor(inst.stacks / 2);
  if (inst.duration != null) inst.duration -= 1;
  return [];
}

export function capStatusStacks(inst: StatusInstance, def: StatusDef, cap = def.maxStacks): void {
  if (cap == null) return;
  if (def.stackMode !== "segments" || !inst.segments) {
    inst.stacks = Math.min(inst.stacks, cap);
    return;
  }

  let excess = Math.max(0, inst.stacks - cap);
  for (const segment of [...inst.segments].sort((a, b) => segmentDuration(a) - segmentDuration(b))) {
    if (excess <= 0) break;
    const removed = Math.min(segment.stacks, excess);
    segment.stacks -= removed;
    excess -= removed;
  }
  inst.segments = inst.segments.filter((segment) => segment.stacks > 0);
  syncSegments(inst);
}
