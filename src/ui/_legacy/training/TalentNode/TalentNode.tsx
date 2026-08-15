// ★ 单个天赋节点按钮 —— 树面板上的一颗可点亮节点。
//
// 五种视觉态(视觉态只由父层计算好传入, 本组件不承载解锁/退还规则):
//   locked       前置未满足 —— 压暗线框, 点击静默
//   available    可解锁且点数够 —— 亮边, 左键/Enter/Space 激活
//   unaffordable 可解锁但点数不够 —— 暖色边, 点击只抖动不派发
//   active       已激活且暂不可退还 —— 点亮, 右键给一次抖动反馈
//   refundable   已激活且可退还 —— 点亮 + 虚线外环, 右键/Alt+左键/Delete 退还
// ★ 悬浮详情用 common/RailPopover(data-rail-item 驱动), 不使用原生 title。

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import type { SquadResourceKey, TalentNodeDef } from "@/data";
import { RailPopover } from "@/ui/common/RailPopover";
import { cx } from "@/ui/common/cx";
import s from "./TalentNode.module.css";

export type TalentNodeState =
  | "locked"
  | "available"
  | "unaffordable"
  | "active"
  | "refundable";

// ===================== 方向图标 =====================
// 从旧训练室迁来, 按 branch.id 查表。画法统一: 48×48 视框、stroke="currentColor"、
// 主体 strokeWidth 1.6、陪衬 1.2 + 低透明度 —— 与据点/探索域图标同一套约定。

const TRACK_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  handLimit: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M9 13h30v24H9z" strokeWidth={1.2} opacity={0.38} />
      <path d="M15 18h18M15 24h12M15 30h8" strokeWidth={1.6} />
      <path d="M36 9v8M32 13h8" strokeWidth={1.6} />
    </svg>
  ),
  redraw: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M12 18a14 14 0 0 1 24-3l3 4" strokeWidth={1.2} opacity={0.38} />
      <path d="M36 30a14 14 0 0 1-24 3l-3-4" strokeWidth={1.2} opacity={0.38} />
      <path d="M36 11v8h-8M12 37v-8h8" strokeWidth={1.6} />
    </svg>
  ),
  wait: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="24" cy="24" r="15" strokeWidth={1.2} opacity={0.38} />
      <path d="M24 15v10l7 4" strokeWidth={1.6} />
      <path d="M10 10l4 4M38 10l-4 4" strokeWidth={1.6} />
    </svg>
  ),
  mana: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="m24 5 14 19-14 19L10 24 24 5Z" strokeWidth={1.2} opacity={0.38} />
      <path d="m24 12 8.5 12-8.5 12-8.5-12L24 12Z" strokeWidth={1.6} />
      <path d="M24 18v12M18 24h12" strokeWidth={1.4} />
    </svg>
  ),
  draw: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M11 9h26v30H11z" strokeWidth={1.2} opacity={0.38} />
      <path d="M17 15h14M17 22h10M17 29h14" strokeWidth={1.6} />
      <path d="M34 34h6M37 31v6" strokeWidth={1.6} />
    </svg>
  ),
  openingHand: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M9 14h30v24H9z" strokeWidth={1.2} opacity={0.38} />
      <path d="M16 20h16M16 26h10M16 32h6" strokeWidth={1.6} />
      <path d="M34 7v9M29.5 11.5h9" strokeWidth={1.6} />
    </svg>
  ),
};

function TrackIcon({ branchId, className }: { branchId: string; className?: string }) {
  const Icon = TRACK_ICONS[branchId] ?? TRACK_ICONS.handLimit;
  return <Icon className={className} />;
}

// ===================== 组件 =====================

interface TalentNodeProps {
  node: TalentNodeDef;
  branchId: string;
  /** 效果文案(父层用资源标签拼好, 如 "手牌上限 +1")。 */
  effectLabel: string;
  state: TalentNodeState;
  /** 远征锁定 / 徽章未启用 —— 全部操作静默, 但仍可悬浮看详情。 */
  disabled: boolean;
  /** 刚激活, 播点亮动效(重挂载 key 由父层负责)。 */
  isLatest: boolean;
  isShaking: boolean;
  /** 当前节点是否位于悬浮目标的依赖路径。 */
  isTrace?: boolean;
  /** 悬浮目标尚未激活时展示的整条路径成本。 */
  reachCost?: number;
  /** Shift+点击是否有足够训练点点亮整条路径。 */
  canQuickBuy?: boolean;
  /** 悬浮详情的朝向: 上半棵树向下开, 下半棵树向上开。 */
  popSide: "top" | "bottom";
  /** 定位与尺寸通道(铁律 3/4): left/top 定圆心, --tn-size 定直径, 均由父层下发到 slot。 */
  style?: CSSProperties;
  onActivate: () => void;
  onQuickBuy: () => void;
  onRefund: () => void;
  onShake: () => void;
  onHoverKey: (key: SquadResourceKey | null) => void;
  onHoverNode: (nodeId: string | null) => void;
}

const STATUS_TEXT: Record<TalentNodeState, string> = {
  locked: "前置节点尚未点亮",
  available: "点击点亮",
  unaffordable: "训练点不足",
  active: "已激活 · 有后续节点依赖, 暂不可退还",
  refundable: "已激活 · 右键 / Alt+点击退还",
};

export function TalentNode({
  node,
  branchId,
  effectLabel,
  state,
  disabled,
  isLatest,
  isShaking,
  isTrace = false,
  reachCost,
  canQuickBuy = false,
  popSide,
  style,
  onActivate,
  onQuickBuy,
  onRefund,
  onShake,
  onHoverKey,
  onHoverNode,
}: TalentNodeProps) {
  const active = state === "active" || state === "refundable";
  const refundable = state === "refundable";

  // 左键: 可激活节点点亮; 点数不足只抖动; Alt+左键对可退还节点走退还。
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (refundable && event.altKey) {
      event.preventDefault();
      onRefund();
      return;
    }
    if (!active && event.shiftKey) {
      event.preventDefault();
      if (canQuickBuy) onQuickBuy();
      else onShake();
      return;
    }
    if (active) return;
    if (state === "available") onActivate();
    else if (state === "unaffordable") onShake();
  }

  // 右键: 可退还节点退还; 不可退还的已激活节点给一次抖动反馈。
  function handleContextMenu(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (disabled) return;
    if (refundable) onRefund();
    else if (active) onShake();
  }

  // 键盘: Enter/Space 走原生按钮点击(激活); Delete/Backspace 退还。
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      if (refundable) onRefund();
      else if (active) onShake();
    }
  }

  return (
    <div className={s["tn-slot"]} style={style}>
      <button
        type="button"
        className={cx(
          s["tn"],
          s[`is-${state}`],
          s[`is-${node.tier}`],
          isLatest && s["is-latest"],
          isShaking && s["is-shaking"],
          isTrace && s["is-trace"],
          disabled && s["is-disabled"],
        )}
        data-rail-item
        aria-label={`${node.name}: ${effectLabel}, 消耗 ${node.cost} 训练点。${STATUS_TEXT[state]}`}
        onMouseEnter={() => {
          onHoverKey(node.key);
          onHoverNode(node.id);
        }}
        onMouseLeave={() => {
          onHoverKey(null);
          onHoverNode(null);
        }}
        onFocus={() => {
          onHoverKey(node.key);
          onHoverNode(node.id);
        }}
        onBlur={() => {
          onHoverKey(null);
          onHoverNode(null);
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
      >
        <span className={s["tn-icon"]} aria-hidden>
          <TrackIcon branchId={branchId} />
        </span>
        <span className={s["tn-cost"]} aria-hidden>
          {node.cost}
        </span>
        <RailPopover side={popSide}>
          <strong className={s["tn-pop-name"]}>{node.name}</strong>
          <span className={s["tn-pop-effect"]}>{effectLabel}</span>
          <span className={s["tn-pop-status"]}>{STATUS_TEXT[state]}</span>
          {reachCost != null && (
            <span className={cx(s["tn-pop-reach"], !canQuickBuy && s["is-over-budget"])}>
              点亮到此还需 {reachCost} 点
            </span>
          )}
          {reachCost != null && reachCost > node.cost && (
            <span className={s["tn-pop-quick"]}>Shift+点击 一次点亮全路径</span>
          )}
        </RailPopover>
      </button>
      {refundable && !disabled && (
        <button
          type="button"
          className={s["tn-refund"]}
          aria-label={`退还${node.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onRefund();
          }}
        >
          −
        </button>
      )}
    </div>
  );
}
