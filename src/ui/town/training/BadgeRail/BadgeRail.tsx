// ★ 徽章列表条 —— 训练室左栏。
//
// 只接收 props 与回调, 不读 store: 徽章清单、当前启用 id、资源标签和点击回调全部由
// TrainingScene 下发。锁定徽章(「待开放」占位)与远征中一律不派发 onPick ——
// 「能不能选」的最终校验在 store 的 selectSquadBadge 里, 这里只是不再多此一问。

import { cx } from "@/ui/common/cx";
import type { SquadBadgeDef, SquadResourceKey } from "@/data";
import s from "./BadgeRail.module.css";

// 条目左侧的小徽章线框(36px, 与树面板核心图形同一画法)。
function BadgeGlyphMini() {
  return (
    <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M36 5 60 19v28L36 61 12 47V19L36 5Z" strokeWidth={1.2} opacity={0.38} />
      <path d="M36 14 51 23v18l-15 9-15-9V23l15-9Z" strokeWidth={1.6} />
      <circle cx="36" cy="32" r="6" strokeWidth={1.6} />
    </svg>
  );
}

// 基础加成摘要: "初始手牌数量 +1"。没有非零加成就显示描述/「无基础加成」。
function baseSummary(
  badge: SquadBadgeDef,
  labels: Record<SquadResourceKey, string>,
): string {
  const entries = (Object.entries(badge.base) as Array<[SquadResourceKey, number | undefined]>)
    .filter(([, value]) => value != null && value !== 0);
  if (!entries.length) return "无基础加成";
  return entries
    .map(([key, value]) => `${labels[key]} ${(value ?? 0) > 0 ? "+" : ""}${value}`)
    .join(" · ");
}

interface BadgeRailProps {
  badges: SquadBadgeDef[];
  activeId: string | null;
  /** 远征中整条只读。 */
  locked: boolean;
  resourceLabels: Record<SquadResourceKey, string>;
  onPick: (badge: SquadBadgeDef) => void;
  /** 父组件唯一的外观通道(铁律 3): 布局尺寸等由场景层经它下发。 */
  className?: string;
}

export function BadgeRail({
  badges,
  activeId,
  locked,
  resourceLabels,
  onPick,
  className,
}: BadgeRailProps) {
  return (
    <section className={cx(s["br"], locked && s["is-locked"], className)} aria-label="小队徽章">
      <header className={s["br-head"]}>
        <span className={s["br-kicker"]}>SQUAD BADGES</span>
        <h3 className={s["br-title"]}>小队徽章</h3>
      </header>

      <div className={s["br-list"]}>
        {badges.map((badge) => {
          const isActive = badge.id === activeId;
          const blocked = badge.locked || locked;
          return (
            <button
              key={badge.id}
              type="button"
              className={cx(s["br-item"], isActive && s["is-active"], badge.locked && s["is-locked"])}
              aria-disabled={blocked || isActive || undefined}
              aria-label={`${badge.name}: ${badge.locked ? "待开放" : isActive ? "已启用" : "可选"}`}
              onClick={() => {
                if (locked || badge.locked || isActive) return;
                onPick(badge);
              }}
            >
              <span className={s["br-icon"]} aria-hidden>
                <BadgeGlyphMini />
              </span>
              <span className={s["br-main"]}>
                <span className={s["br-item-kicker"]}>{badge.kicker}</span>
                <span className={s["br-item-row"]}>
                  <strong className={s["br-name"]}>{badge.name}</strong>
                  <span className={s["br-status"]}>
                    {isActive ? "已启用" : badge.locked ? "待开放" : "可选"}
                  </span>
                </span>
                <span className={s["br-summary"]}>
                  {badge.locked ? badge.desc : baseSummary(badge, resourceLabels)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
