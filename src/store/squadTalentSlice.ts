// 小队天赋 —— 徽章选择与天赋节点的点亮 / 退还。

import { canActivate, canRefund, getBadge, getNode, spentPoints } from "../data";
import { squadTrainingPoints } from "./townProfile";
import type { TownGet, TownSet, TownStore } from "./townTypes";

export type SquadTalentSlice = Pick<
  TownStore,
  "selectSquadBadge" | "activateTalentNode" | "refundTalentNode" | "resetSquadTalent"
>;

export function createSquadTalentSlice(set: TownSet, get: TownGet): SquadTalentSlice {
  return {
    // 切换小队徽章。★ 切换即重置整棵树(nodes 清空, 训练点全部回到池子)——
    //   「换徽章会丢掉已投入的点」这一确认在 UI 层做, store 只负责落账。
    //   ⚠ locked 的占位徽章直接拒绝, UI 与 store 两层都拦。
    selectSquadBadge: (id) => {
      const badge = getBadge(id);
      if (!badge || badge.locked) return;
      set({ squadTalent: { badgeId: id, nodes: [] } });
    },

    // 点亮一个天赋节点。校验用数据层的 canActivate:
    //   未激活 + 前置满足 + 剩余训练点(总训练点 - 本徽章已投入)够付。
    activateTalentNode: (nodeId) => {
      const { squadTalent, characters, awakened, techTree } = get();
      if (!squadTalent.badgeId) return;
      const badge = getBadge(squadTalent.badgeId);
      if (!badge || !getNode(badge, nodeId)) return;
      const remaining = squadTrainingPoints({ characters, awakened, techTree }) - spentPoints(badge, squadTalent.nodes);
      if (!canActivate(badge, squadTalent.nodes, nodeId, remaining)) return;
      set({ squadTalent: { badgeId: badge.id, nodes: [...squadTalent.nodes, nodeId] } });
    },

    // 单点退还。校验用 canRefund: 退还后不破坏其余节点的前置依赖。
    refundTalentNode: (nodeId) => {
      const { squadTalent } = get();
      if (!squadTalent.badgeId) return;
      const badge = getBadge(squadTalent.badgeId);
      if (!badge || !canRefund(badge, squadTalent.nodes, nodeId)) return;
      set({
        squadTalent: {
          badgeId: badge.id,
          nodes: squadTalent.nodes.filter((id) => id !== nodeId),
        },
      });
    },

    resetSquadTalent: () => {
      const { squadTalent } = get();
      if (!squadTalent.badgeId) return;
      set({ squadTalent: { badgeId: squadTalent.badgeId, nodes: [] } });
    },
  };
}
