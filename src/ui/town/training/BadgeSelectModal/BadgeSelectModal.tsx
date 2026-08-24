import { useEffect, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import type { SquadBadgeDef, SquadResourceKey } from "@/data";
import { cx } from "@/ui/common/cx";
import { badgeThemeVars } from "../styles/badgeTheme";
import { BadgeGlyph } from "./badgeGlyphs";
import s from "./BadgeSelectModal.module.css";

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

interface BadgeSelectModalProps {
  badges: SquadBadgeDef[];
  activeId: string | null;
  /** 远征中整块只读。 */
  locked: boolean;
  resourceLabels: Record<SquadResourceKey, string>;
  onConfirm: (badge: SquadBadgeDef) => void;
  onClose: () => void;
  /** 当前徽章已投入的点数, 仅用于确认前提示。 */
  spentPoints?: number;
  className?: string;
}

export function BadgeSelectModal({
  badges,
  activeId,
  locked,
  resourceLabels,
  onConfirm,
  onClose,
  spentPoints = 0,
  className,
}: BadgeSelectModalProps) {
  const [selectedId, setSelectedId] = useState(() => {
    if (activeId && badges.some((badge) => badge.id === activeId)) return activeId;
    return badges.find((badge) => !badge.locked)?.id ?? badges[0]?.id ?? null;
  });
  const selectedBadge = badges.find((badge) => badge.id === selectedId) ?? badges[0];
  const activeBadge = badges.find((badge) => badge.id === activeId);
  const canConfirm = Boolean(selectedBadge && !locked && !selectedBadge.locked && selectedBadge.id !== activeId);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (badges.length === 0) return;
      event.preventDefault();
      const currentIndex = Math.max(0, badges.findIndex((badge) => badge.id === selectedId));
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + direction + badges.length) % badges.length;
      setSelectedId(badges[nextIndex].id);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [badges, onClose, selectedId]);

  function selectBadge(badge: SquadBadgeDef) {
    setSelectedId(badge.id);
  }

  function confirmFromKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" || !canConfirm || !selectedBadge) return;
    if (event.target instanceof HTMLButtonElement && !event.target.classList.contains(s["bsm-card"])) return;
    event.preventDefault();
    onConfirm(selectedBadge);
  }

  function closeFromScrim(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  const detail = selectedBadge
    ? selectedBadge.locked
      ? `${selectedBadge.desc}${selectedBadge.requirement ? ` 解锁条件: ${selectedBadge.requirement}` : ""}`
      : `${baseSummary(selectedBadge, resourceLabels)}${selectedBadge.id !== activeId && spentPoints > 0 ? ` · 切换将退还 ${spentPoints} 点训练点` : ""}`
    : "暂无可用徽章";
  const confirmHint = locked
    ? "远征中无法更换徽章"
    : selectedBadge?.locked
      ? "该徽章尚未解锁"
      : selectedBadge?.id === activeId
        ? "该徽章已启用"
        : "暂无可用徽章";

  return (
    <div className={s["bsm-scrim"]} onMouseDown={closeFromScrim} role="presentation">
      <section
        className={cx(s["bsm-panel"], locked && s["is-locked"], className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-select-title"
        onKeyDown={confirmFromKeyboard}
      >
        <header className={s["bsm-head"]}>
          <div>
            <span className={s["bsm-kicker"]}>SQUAD BADGES</span>
            <h2 id="badge-select-title">选择小队徽章</h2>
          </div>
          <div className={s["bsm-head-side"]}>
            <span className={s["bsm-active-state"]}>{activeBadge ? `已启用: ${activeBadge.name}` : "未启用"}</span>
            <button className={s["bsm-close"]} type="button" aria-label="关闭徽章选择" onClick={onClose}>
              ×
            </button>
          </div>
        </header>

        <div className={s["bsm-grid"]}>
          {badges.map((badge, index) => {
            const isActive = badge.id === activeId;
            const isSelected = badge.id === selectedId;
            const status = isActive ? "已启用" : badge.locked ? "待开放" : "可选";
            const cardStyle = { ...badgeThemeVars(badge.id), "--card-delay": `${index * 55}ms` } as CSSProperties;
            return (
              <button
                key={badge.id}
                type="button"
                className={cx(s["bsm-card"], isSelected && s["is-selected"], isActive && s["is-active"], badge.locked && s["is-locked"])}
                style={cardStyle}
                aria-pressed={isSelected}
                onClick={() => selectBadge(badge)}
              >
                <span className={s["bsm-art-wrap"]} aria-hidden="true">
                  <BadgeGlyph badgeId={badge.id} className={s["bsm-art"]} />
                </span>
                <span className={s["bsm-card-copy"]}>
                  <span className={s["bsm-card-kicker"]}>{badge.kicker}</span>
                  <span className={s["bsm-card-name"]}>{badge.name}</span>
                  <span className={s["bsm-chip"]}>{status}</span>
                </span>
                <span className={s["bsm-card-arrow"]} aria-hidden="true">↗</span>
              </button>
            );
          })}
        </div>

        <footer className={s["bsm-foot"]} style={selectedBadge ? badgeThemeVars(selectedBadge.id) : undefined}>
          <div className={s["bsm-detail"]}>
            <span className={s["bsm-detail-label"]}>SELECTED PROFILE</span>
            <strong>{selectedBadge?.name ?? "暂无可用徽章"}</strong>
            <p>{detail}</p>
          </div>
          <div className={s["bsm-action-column"]}>
            {!canConfirm && <span className={s["bsm-hint"]}>{confirmHint}</span>}
            <div className={s["bsm-actions"]}>
              <button type="button" className={s["bsm-cancel"]} onClick={onClose}>取消</button>
              <button
                type="button"
                className={s["bsm-confirm"]}
                disabled={!canConfirm}
                onClick={() => selectedBadge && onConfirm(selectedBadge)}
              >
                启用该徽章
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}