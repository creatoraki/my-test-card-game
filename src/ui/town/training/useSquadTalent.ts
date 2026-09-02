// 小队徽章与天赋树的交互层 —— 训练室(设施场景)与编队页的天赋树弹窗共用这一份。
//
// ★ 规则判定一律来自 @/data/squadTalents 的纯函数(canActivate / canRefund / pathTo /
//   spentPoints), 本文件**不重写任何规则**, 只负责: 当前徽章、剩余点、只读判定,
//   以及点亮/退还/快捷点亮/切换徽章这四个动作的反馈状态(抖动与脉冲)。
// ★ 抽出来的动机: 编队页要能直接开分配树, 而这套交互不该在两处各写一遍。

import { useEffect, useState } from "react";
import {
  canActivate,
  getBadge,
  getNode,
  pathTo,
  spentPoints,
  type SquadBadgeDef,
  type SquadResourceKey,
} from "@/data";
import { useRunStore, type Screen } from "@/store/runStore";
import { squadTrainingPoints, useTownStore } from "@/store/townStore";

export const RESOURCE_LABELS: Record<SquadResourceKey, string> = {
  openingHand: "初始手牌",
  drawCount: "回合抽牌",
  redraws: "换牌次数",
  waits: "待机次数",
  mana: "每回合费用",
  handLimit: "手牌上限",
};

// 「人还在据点里」的界面集合 —— 只有这些界面允许改动天赋树。
// ⚠ 远征一旦开始(elevator / explore / battle / 结算), 整棵树只读: 中途改小队资源会让
//   已经建立的战斗会话与实际配置脱节。
const BASE_SCREENS: Screen[] = ["menu", "town", "formation", "sortie"];

export interface SquadTalentController {
  badge: SquadBadgeDef | undefined;
  /** 全队可用训练点(= 各队员卡组等级之和)。 */
  trainingPoints: number;
  spent: number;
  remaining: number;
  locked: boolean;
  activated: string[];
  resourceLabels: Record<SquadResourceKey, string>;
  shakeId: string | null;
  setShakeId: (nodeId: string | null) => void;
  pulse: { nodeId: string; n: number } | null;
  hoverKey: SquadResourceKey | null;
  setHoverKey: (key: SquadResourceKey | null) => void;
  activate: (nodeId: string) => void;
  refund: (nodeId: string) => void;
  quickBuy: (nodeId: string) => void;
  selectBadge: (picked: SquadBadgeDef) => boolean;
}

export function useSquadTalent(): SquadTalentController {
  const squadTalent = useTownStore((state) => state.squadTalent);
  const trainingPoints = useTownStore(squadTrainingPoints);
  const selectSquadBadge = useTownStore((state) => state.selectSquadBadge);
  const activateTalentNode = useTownStore((state) => state.activateTalentNode);
  const refundTalentNode = useTownStore((state) => state.refundTalentNode);
  const screen = useRunStore((state) => state.screen);

  const [shakeId, setShakeId] = useState<string | null>(null);
  const [pulse, setPulse] = useState<{ nodeId: string; n: number } | null>(null);
  const [hoverKey, setHoverKey] = useState<SquadResourceKey | null>(null);

  const locked = !BASE_SCREENS.includes(screen);
  // ⚠ 防御: 存档里的 badgeId 万一指向锁定徽章(理论上 store 已拒绝), 按「未启用」处理。
  const stored = squadTalent.badgeId ? getBadge(squadTalent.badgeId) : undefined;
  const badge = stored && !stored.locked ? stored : undefined;
  const spent = badge ? spentPoints(badge, squadTalent.nodes) : 0;
  const remaining = Math.max(0, trainingPoints - spent);

  useEffect(() => {
    if (!shakeId) return;
    const timer = window.setTimeout(() => setShakeId(null), 260);
    return () => window.clearTimeout(timer);
  }, [shakeId]);

  // 点亮: store 侧仍有 canActivate 校验, 这里再验一遍是为了 pulse 反馈不与落账脱节。
  function activate(nodeId: string) {
    if (!badge || locked) return;
    if (!canActivate(badge, squadTalent.nodes, nodeId, remaining)) return;
    if (!getNode(badge, nodeId)) return;
    activateTalentNode(nodeId);
    setPulse((prev) => ({ nodeId, n: (prev?.n ?? 0) + 1 }));
  }

  function refund(nodeId: string) {
    if (!badge || locked) return;
    refundTalentNode(nodeId);
  }

  // Shift+点击: 一次点亮整条依赖路径; 点数不够只抖动, 不做部分点亮。
  function quickBuy(nodeId: string) {
    if (!badge || locked) return;
    const path = pathTo(badge, nodeId);
    const activatedSet = new Set(squadTalent.nodes);
    const pending = path.filter((node) => !activatedSet.has(node.id));
    if (!pending.length) return;
    const cost = pending.reduce((sum, node) => sum + node.cost, 0);
    if (cost > remaining) {
      setShakeId(nodeId);
      return;
    }
    for (const node of pending) activateTalentNode(node.id);
    const target = pending[pending.length - 1];
    setPulse((prev) => ({ nodeId: target.id, n: (prev?.n ?? 0) + 1 }));
  }

  /** 切换徽章。返回 false = 未发生切换(锁定 / 待开放 / 就是当前这枚)。 */
  function selectBadge(picked: SquadBadgeDef): boolean {
    if (locked || picked.locked || picked.id === squadTalent.badgeId) return false;
    selectSquadBadge(picked.id);
    setPulse(null);
    return true;
  }

  return {
    badge,
    trainingPoints,
    spent,
    remaining,
    locked,
    activated: squadTalent.nodes,
    resourceLabels: RESOURCE_LABELS,
    shakeId,
    setShakeId,
    pulse,
    hoverKey,
    setHoverKey,
    activate,
    refund,
    quickBuy,
    selectBadge,
  };
}
