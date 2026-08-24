// 训练室 —— 据点设施场景(极简版): 只有暗底金色背景与浮升光粒 + 居中的径向天赋树。
//
// 原页头 / 剩余点读数 / 左栏徽章条 / 底部六格属性预览 / 锁定横幅 / 重置与确认弹窗
// 全部移除; 剩余训练点与投入进度显示在树面板头部。徽章切换改为点击天赋树中央的
// 徽章核心节点, 弹出居中的选择 modal; 选中后经底栏确认切换(已投入点会随切换返还清空)。
// 解锁、退还、花费的规则判定全部来自 @/data/squadTalents 的纯函数, 本文件不重写规则。

import { useEffect, useMemo, useState } from "react";
import {
  SQUAD_BADGES,
  canActivate,
  getBadge,
  getNode,
  pathTo,
  spentPoints,
  type SquadBadgeDef,
  type SquadResourceKey,
} from "@/data";
import { useRunStore } from "@/store/runStore";
import { squadTrainingPoints, useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { BadgeSelectModal } from "../BadgeSelectModal";
import { SquadResourceBar } from "../SquadResourceBar";
import { TalentTreeRadial } from "../TalentTreeRadial";
import s from "./TrainingScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const RESOURCE_LABELS: Record<SquadResourceKey, string> = {
  openingHand: "初始手牌",
  drawCount: "回合抽牌",
  redraws: "换牌次数",
  waits: "待机次数",
  mana: "每回合费用",
  handLimit: "手牌上限",
};

interface Props {
  leaving?: boolean;
  onBack?: () => void;
}

export function TrainingScene({ leaving = false, onBack }: Props) {
  const squadTalent = useTownStore((state) => state.squadTalent);
  const trainingPoints = useTownStore(squadTrainingPoints);
  const selectSquadBadge = useTownStore((state) => state.selectSquadBadge);
  const activateTalentNode = useTownStore((state) => state.activateTalentNode);
  const refundTalentNode = useTownStore((state) => state.refundTalentNode);
  const screen = useRunStore((state) => state.screen);
  // 未启用徽章时 modal 默认展开, 引导首次选择。
  const [drawerOpen, setDrawerOpen] = useState(() => !squadTalent.badgeId);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [pulse, setPulse] = useState<{ nodeId: string; n: number } | null>(null);
  const [hoverKey, setHoverKey] = useState<SquadResourceKey | null>(null);

  const locked = screen !== "town";
  // ⚠ 防御: 存档里的 badgeId 万一指向锁定徽章(理论上 store 已拒绝), 按「未启用」处理。
  const badge = squadTalent.badgeId ? getBadge(squadTalent.badgeId) : undefined;
  const activeBadge = badge && !badge.locked ? badge : undefined;
  const spent = activeBadge ? spentPoints(activeBadge, squadTalent.nodes) : 0;
  const remaining = Math.max(0, trainingPoints - spent);

  // 背景浮升光粒(暗底金色氛围): 黄金角分布 + 负延迟, 初始即散布在途中。
  const particles = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: (i * 137.508) % 100,
        size: 2 + ((i * 7) % 5),
        duration: 9 + ((i * 13) % 16),
        delay: -((i * 3.7) % 14),
      })),
    [],
  );

  useEffect(() => {
    if (!shakeId) return;
    const timer = window.setTimeout(() => setShakeId(null), 260);
    return () => window.clearTimeout(timer);
  }, [shakeId]);

  // modal 确认徽章: 锁定/当前徽章不响应; store 侧清空本徽章投入并返还训练点。
  function confirmBadge(picked: SquadBadgeDef) {
    if (locked || picked.locked || picked.id === squadTalent.badgeId) return;
    selectSquadBadge(picked.id);
    setPulse(null);
    setDrawerOpen(false);
  }

  // 点亮节点: store 侧仍有 canActivate 校验, 这里再验一遍是为了 pulse 反馈不与落账脱节。
  function handleActivate(nodeId: string) {
    if (!activeBadge || locked) return;
    if (!canActivate(activeBadge, squadTalent.nodes, nodeId, remaining)) return;
    const node = getNode(activeBadge, nodeId);
    if (!node) return;
    activateTalentNode(nodeId);
    setPulse({ nodeId, n: (pulse?.n ?? 0) + 1 });
  }

  function handleRefund(nodeId: string) {
    if (!activeBadge || locked) return;
    refundTalentNode(nodeId);
  }

  function handleQuickBuy(nodeId: string) {
    if (!activeBadge || locked) return;
    const path = pathTo(activeBadge, nodeId);
    const activatedSet = new Set(squadTalent.nodes);
    const pending = path.filter((node) => !activatedSet.has(node.id));
    const cost = pending.reduce((sum, node) => sum + node.cost, 0);
    if (!pending.length) return;
    if (cost > remaining) {
      setShakeId(nodeId);
      return;
    }

    for (const node of pending) activateTalentNode(node.id);
    const target = pending[pending.length - 1];
    setPulse({ nodeId: target.id, n: (pulse?.n ?? 0) + 1 });
  }

  return (
    <div className={cn("tr-scene", leaving && "is-leaving")}>
      <div className={cn("tr-particles")} aria-hidden>
        {particles.map((p, i) => (
          <span
            key={i}
            className={cn("tr-particle")}
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <main className={cn("tr-stage-wrap")}>
        {activeBadge ? (
          <div className={s["tr-tree-shell"]}>
            <TalentTreeRadial
              badge={activeBadge}
              activated={squadTalent.nodes}
              remaining={remaining}
              totalTrainingPoints={trainingPoints}
              locked={locked}
              resourceLabels={RESOURCE_LABELS}
              pulse={pulse}
              shakeId={shakeId}
              onRequestShake={setShakeId}
              onActivate={handleActivate}
              onQuickBuy={handleQuickBuy}
              onRefund={handleRefund}
              onHoverKey={setHoverKey}
              onCoreClick={() => setDrawerOpen((open) => !open)}
              onClose={onBack}
              className={s["tr-tree"]}
            />
            <SquadResourceBar highlightKey={hoverKey} className={s["tr-resource-bar"]} />
          </div>
        ) : (
          <div className={cn("tr-empty")} role="status">
            <span className={cn("tr-panel-kicker")}>NO BADGE</span>
            <h3 className={cn("tr-empty-title")}>尚未启用徽章</h3>
            <p className={cn("tr-empty-sub")}>点击下方按钮选择一枚小队徽章, 天赋树将在这里展开。</p>
            <button className={cn("tr-empty-open")} type="button" onClick={() => setDrawerOpen(true)}>
              选择徽章
            </button>
            {onBack && (
              <button className={cn("tr-empty-close")} type="button" aria-label="返回据点" onClick={onBack}>
                ×
              </button>
            )}
          </div>
        )}
      </main>

      {drawerOpen && (
        <BadgeSelectModal
          badges={SQUAD_BADGES}
          activeId={activeBadge?.id ?? null}
          locked={locked}
          resourceLabels={RESOURCE_LABELS}
          spentPoints={spent}
          onConfirm={confirmBadge}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
