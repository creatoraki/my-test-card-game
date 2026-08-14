// 训练室 —— 据点设施场景, 只保留页面骨架与状态编排:
//   页头 / 剩余训练点读数 / 左侧徽章列表条 + 训练点来源浮层 / 右侧天赋树 /
//   底部六格队伍属性预览 / 远征锁定横幅 / 重置分配与切换徽章两个确认弹窗。
//
// 徽章列表条与天赋树各自成组件(见 BadgeRail / TalentTree / TalentNode / TrainingConfirm),
// 解锁、退还、花费的规则判定全部来自 @/data/squadTalents 的纯函数, 本文件不重写规则。

import { useEffect, useState, type CSSProperties } from "react";
import { RULES, type SquadResourceMods } from "@/engine";
import {
  SQUAD_BADGES,
  canActivate,
  getBadge,
  getCharacter,
  getNode,
  spentPoints,
  squadModsOf,
  type SquadBadgeDef,
  type SquadResourceKey,
} from "@/data";
import { useRunStore } from "@/store/runStore";
import { deriveStats, squadTrainingPoints, useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { BadgeRail } from "../BadgeRail";
import { TalentTree } from "../TalentTree";
import { TrainingConfirm } from "../TrainingConfirm";
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

const RESOURCE_BASE: Record<SquadResourceKey, number> = {
  openingHand: 4,
  drawCount: RULES.hand.partyBonusDrawCount,
  redraws: RULES.timeline.redrawsPerRound,
  waits: RULES.timeline.waitsPerRound,
  mana: RULES.resource.perRound,
  handLimit: RULES.hand.baseHandLimit,
};

const RESOURCE_CAPS: Partial<Record<SquadResourceKey, number>> = {
  drawCount: RULES.squadCaps.drawCount,
  mana: RULES.squadCaps.mana,
  handLimit: RULES.squadCaps.handLimit,
};

interface Props {
  leaving?: boolean;
}

interface ResourcePreview {
  key: SquadResourceKey;
  base: number;
  badge: number;
  talent: number;
  role: number;
  final: number;
  cap: number | null;
}

function roleResourceBonus(
  key: SquadResourceKey,
  characters: ReturnType<typeof useTownStore.getState>["characters"],
  party: string[],
): number {
  if (key !== "openingHand" && key !== "drawCount" && key !== "handLimit") return 0;
  return party.reduce((sum, charId) => {
    const character = characters[charId];
    return character ? sum + deriveStats(character)[key === "handLimit" ? "handLimit" : "drawCount"] : sum;
  }, 0);
}

function resourceFinal(
  key: SquadResourceKey,
  base: number,
  mods: SquadResourceMods,
  role: number,
): number {
  const value = base + mods[key] + role;
  const cap = RESOURCE_CAPS[key];
  return cap == null ? Math.max(0, Math.round(value)) : Math.max(0, Math.min(cap, Math.round(value)));
}

export function TrainingScene({ leaving = false }: Props) {
  const squadTalent = useTownStore((state) => state.squadTalent);
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const trainingPoints = useTownStore(squadTrainingPoints);
  const selectSquadBadge = useTownStore((state) => state.selectSquadBadge);
  const activateTalentNode = useTownStore((state) => state.activateTalentNode);
  const refundTalentNode = useTownStore((state) => state.refundTalentNode);
  const resetSquadTalent = useTownStore((state) => state.resetSquadTalent);
  const screen = useRunStore((state) => state.screen);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState<SquadBadgeDef | null>(null);
  const [hoverKey, setHoverKey] = useState<SquadResourceKey | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [bump, setBump] = useState<{ key: SquadResourceKey; n: number } | null>(null);
  const [pulse, setPulse] = useState<{ nodeId: string; n: number } | null>(null);

  const locked = screen !== "town";
  // ⚠ 防御: 存档里的 badgeId 万一指向锁定徽章(理论上 store 已拒绝), 按「未启用」处理。
  const badge = squadTalent.badgeId ? getBadge(squadTalent.badgeId) : undefined;
  const activeBadge = badge && !badge.locked ? badge : undefined;
  const mods = squadModsOf(activeBadge?.id ?? null, squadTalent.nodes);
  const spent = activeBadge ? spentPoints(activeBadge, squadTalent.nodes) : 0;
  const remaining = Math.max(0, trainingPoints - spent);
  const previews: ResourcePreview[] = (Object.keys(RESOURCE_LABELS) as SquadResourceKey[]).map((key) => {
    const role = roleResourceBonus(key, characters, party);
    const badgeValue = activeBadge ? activeBadge.base[key] ?? 0 : 0;
    const talent = activeBadge ? mods[key] - badgeValue : 0;
    return {
      key,
      base: RESOURCE_BASE[key],
      badge: badgeValue,
      talent,
      role,
      final: resourceFinal(key, RESOURCE_BASE[key], mods, role),
      cap: RESOURCE_CAPS[key] ?? null,
    };
  });

  useEffect(() => {
    if (!shakeId) return;
    const timer = window.setTimeout(() => setShakeId(null), 260);
    return () => window.clearTimeout(timer);
  }, [shakeId]);

  // 徽章列表条点击: 锁定/当前徽章不响应; 没投入过点直接切换, 有投入弹确认。
  function pickBadge(picked: SquadBadgeDef) {
    if (locked || picked.locked || picked.id === squadTalent.badgeId) return;
    if (!squadTalent.badgeId || spent === 0) {
      selectSquadBadge(picked.id);
      setPulse(null);
      return;
    }
    setConfirmSwitch(picked);
  }

  // 点亮节点: store 侧仍有 canActivate 校验, 这里再验一遍是为了 bump 反馈不与落账脱节。
  function handleActivate(nodeId: string) {
    if (!activeBadge || locked) return;
    if (!canActivate(activeBadge, squadTalent.nodes, nodeId, remaining)) return;
    const node = getNode(activeBadge, nodeId);
    if (!node) return;
    activateTalentNode(nodeId);
    const n = (bump?.n ?? 0) + 1;
    setBump({ key: node.key, n });
    setPulse({ nodeId, n });
  }

  function handleRefund(nodeId: string) {
    if (!activeBadge || locked) return;
    refundTalentNode(nodeId);
  }

  return (
    <div className={cn("tr-scene", leaving && "is-leaving")}>
      <header className={cn("tr-header")}>
        <span className={cn("tr-kicker")}>TRAINING BAY</span>
        <h2 className={cn("tr-title")}>训练室</h2>
        <p className={cn("tr-sub")}>小队天赋 · 训练点分配</p>
      </header>

      <div className={cn("tr-readout")}>
        <span className={cn("tr-chip-label")}>剩余训练点</span>
        <div className={cn("tr-chip-value")}>
          <strong key={bump?.n ?? "stable"} className={cn(bump && "is-bumping")}>{remaining}</strong>
          <span>/ {trainingPoints}</span>
        </div>
        <i
          className={cn("tr-readout-meter")}
          style={{ "--meter": `${trainingPoints ? (spent / trainingPoints) * 100 : 0}%` } as CSSProperties}
        />
      </div>

      <main className={cn("tr-layout", locked && "is-locked")}>
        <section className={cn("tr-left")} aria-label="徽章与训练点">
          <BadgeRail
            badges={SQUAD_BADGES}
            activeId={activeBadge?.id ?? null}
            locked={locked}
            resourceLabels={RESOURCE_LABELS}
            onPick={pickBadge}
            className={s["tr-rail"]}
          />
          <div className={cn("tr-source")} tabIndex={0} aria-label="查看训练点来源">
            <span>训练点来源</span>
            <strong>{trainingPoints}</strong>
            <span className={cn("tr-info")}>ⓘ</span>
            <span className={cn("tr-pop", "tr-source-pop")}>
              {party.length ? (
                party.map((charId) => (
                  <span key={charId} className={cn("tr-source-row")}>
                    <strong>{characters[charId]?.deckLevel ?? 0}</strong>
                    <span>{characters[charId] ? getCharacter(charId).name : "未知队员"} · 卡组等级</span>
                  </span>
                ))
              ) : <span className={cn("tr-source-empty")}>暂无上阵成员</span>}
            </span>
          </div>
        </section>

        {activeBadge ? (
          <TalentTree
            badge={activeBadge}
            activated={squadTalent.nodes}
            remaining={remaining}
            locked={locked}
            resourceLabels={RESOURCE_LABELS}
            pulse={pulse}
            shakeId={shakeId}
            onRequestShake={setShakeId}
            onActivate={handleActivate}
            onRefund={handleRefund}
            onHoverKey={setHoverKey}
          />
        ) : (
          <div className={cn("tr-empty")} role="status">
            <span className={cn("tr-panel-kicker")}>NO BADGE</span>
            <h3 className={cn("tr-empty-title")}>尚未启用徽章</h3>
            <p className={cn("tr-empty-sub")}>从左侧列表选择一枚小队徽章, 天赋树将在这里展开。</p>
          </div>
        )}
      </main>

      <section className={cn("tr-bar")} aria-label="队伍属性预览">
        {previews.map((item) => {
          const capped = item.cap != null && item.final >= item.cap;
          const totalBonus = item.badge + item.talent + item.role;
          const isBumping = bump?.key === item.key;
          return (
            <div
              key={item.key}
              className={cn("tr-preview-cell", capped && "is-capped")}
              data-hl={hoverKey === item.key ? "active" : undefined}
              tabIndex={0}
              aria-label={`${RESOURCE_LABELS[item.key]} ${item.final}`}
              onMouseEnter={() => setHoverKey(item.key)}
              onMouseLeave={() => setHoverKey(null)}
              onFocus={() => setHoverKey(item.key)}
              onBlur={() => setHoverKey(null)}
            >
              <span className={cn("tr-preview-name")}>{RESOURCE_LABELS[item.key]}</span>
              <strong
                key={`${item.key}-${isBumping ? bump?.n : "stable"}`}
                className={cn("tr-preview-value", isBumping && "is-bumping")}
              >
                {item.final}
              </strong>
              <span className={cn("tr-preview-bonus")}>{totalBonus > 0 ? `+${totalBonus}` : "—"}</span>
              {capped && <em>封顶</em>}
              <span className={cn("tr-pop", "tr-preview-pop")}>
                {item.badge !== 0 && <span>徽章 +{item.badge}</span>}
                {item.talent !== 0 && <span>天赋 +{item.talent}</span>}
                {item.role !== 0 && <span>队伍 +{item.role}</span>}
                {totalBonus === 0 && <span>暂无额外加成</span>}
              </span>
            </div>
          );
        })}
      </section>

      {locked && <div className={cn("tr-lock-banner")}>远征进行中，方案已锁定</div>}

      <button
        className={cn("tr-reset")}
        type="button"
        disabled={locked || !activeBadge || spent === 0}
        onClick={() => setConfirmReset(true)}
      >
        重置分配
      </button>

      {confirmReset && !leaving && (
        <TrainingConfirm
          kicker="RESET ALLOCATION"
          title="重置整棵训练树？"
          message={<>已投入的 {spent} 点训练点将全部返还, 徽章保持启用。</>}
          confirmLabel="确认重置"
          onConfirm={() => {
            resetSquadTalent();
            setPulse(null);
            setConfirmReset(false);
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      {confirmSwitch && !leaving && (
        <TrainingConfirm
          kicker="SWITCH BADGE"
          title={`更换为「${confirmSwitch.name}」？`}
          message={
            activeBadge
              ? <>当前「{activeBadge.name}」已投入的 {spent} 点训练点将全部返还。</>
              : <>当前分配将清空, 训练点全部返还。</>
          }
          confirmLabel="确认更换"
          onConfirm={() => {
            selectSquadBadge(confirmSwitch.id);
            setPulse(null);
            setConfirmSwitch(null);
          }}
          onCancel={() => setConfirmSwitch(null)}
        />
      )}
    </div>
  );
}
