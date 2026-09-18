import type { DamageCtx, StatusCtx, StatusDef } from "../types";

export const ALCHEMIST_STATUS_DEFS: Record<string, StatusDef> = {
  emberWall: {
    id: "emberWall",
    name: "余烬护壁",
    emoji: "🔥",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "护盾被击破时，对击破者施加灼烧，随后移除本状态。",
    hooks: {
      onShieldBroken: (c: StatusCtx, dmg: DamageCtx) => {
        const burnStacks = Math.round(c.inst.data?.burnStacks ?? 0);
        if (dmg.sourceId && dmg.sourceId !== c.ownerId && burnStacks > 0)
          c.ops.applyStatus(c.state, dmg.sourceId, "burn", burnStacks, 2, undefined, c.ownerId);
        c.inst.stacks = 0;
      },
    },
  },
};
