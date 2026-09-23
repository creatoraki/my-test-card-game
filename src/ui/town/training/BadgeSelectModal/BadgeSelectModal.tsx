import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { SquadBadgeDef, SquadResourceKey } from "@/data";
import { cx } from "@/ui/common/shared/cx";
import { badgeThemeVars } from "@/ui/town/training/styles/badgeTheme";
import { BadgeCoreArtwork } from "@/ui/town/training/TalentArtwork/BadgeCoreArtwork";
import { BadgePanelFrame, BadgeRowFrame } from "./BadgePanelFrame";
import { BadgeScrollRail } from "./BadgeScrollRail";
import s from "./BadgeSelectModal.module.css";

function baseSummary(badge: SquadBadgeDef, labels: Record<SquadResourceKey, string>) {
  return (Object.entries(badge.base) as Array<[SquadResourceKey, number]>)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${labels[key]}${value > 0 ? "＋" : ""}${value}`)
    .join("，") || "无基础加成";
}

interface BadgeSelectModalProps {
  badges: SquadBadgeDef[];
  activeId: string | null;
  locked: boolean;
  resourceLabels: Record<SquadResourceKey, string>;
  onConfirm: (badge: SquadBadgeDef) => void;
  onClose: () => void;
  spentPoints?: number;
  className?: string;
}

/** 左侧独立浮窗，直接使用编队画布的设计像素。 */
export function BadgeSelectModal({ badges, activeId, locked, resourceLabels, onConfirm,
  onClose, spentPoints = 0, className }: BadgeSelectModalProps) {
  const id = useId();
  const panelRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState(activeId ?? badges.find(badge => !badge.locked)?.id);
  const selected = badges.find(badge => badge.id === selectedId);
  const canConfirm = Boolean(selected && !locked && !selected.locked && selected.id !== activeId);

  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function navigate(event: KeyboardEvent<HTMLElement>) {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key) || !badges.length) return;
    event.preventDefault();
    const index = Math.max(0, badges.findIndex(badge => badge.id === selectedId));
    const next = event.key === "Home" ? 0 : event.key === "End" ? badges.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : -1) + badges.length) % badges.length;
    setSelectedId(badges[next].id);
    const button = listRef.current?.querySelectorAll<HTMLButtonElement>("button")[next];
    button?.focus({ preventScroll: true });
    if (button && listRef.current) {
      const list = listRef.current;
      if (button.offsetTop < list.scrollTop) list.scrollTop = button.offsetTop;
      else if (button.offsetTop + button.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = button.offsetTop + button.offsetHeight - list.clientHeight;
      }
    }
  }

  return (
    <section ref={panelRef} className={cx(s.panel, className)} role="dialog" tabIndex={-1} onKeyDown={navigate}
      aria-labelledby={`${id}-heading`} aria-describedby={`${id}-intro`}>
      <BadgePanelFrame className={s.frame} />
      <header className={s.header}>
        <h2 id={`${id}-heading`}><span aria-hidden="true">✧</span>天赋核心<span aria-hidden="true">✧</span></h2>
        <p id={`${id}-intro`}>选择不同的核心，开启不同的天赋方向。</p>
        <button type="button" className={s.close} aria-label="关闭徽章选择" onClick={onClose}>
          <svg viewBox="0 0 60 60" fill="none" aria-hidden="true">
            <circle cx="30" cy="30" r="28" fill="#0c0d0c" stroke="#8d652c" />
            <circle cx="30" cy="30" r="25" stroke="#f9d68c" strokeWidth="1.5" />
            <path d="m20 19 20 22M40 19 20 41" stroke="#fff9ea" strokeWidth="3.5" />
          </svg>
        </button>
      </header>
      <div className={s.body}>
        <div ref={listRef} className={s.list} aria-label="小队徽章列表">
          {badges.map(badge => {
            const active = badge.id === activeId;
            return (
              <button key={badge.id} type="button" className={s.card} style={badgeThemeVars(badge.id)}
                data-selected={badge.id === selectedId} data-locked={badge.locked || undefined}
                aria-pressed={badge.id === selectedId} aria-disabled={locked || badge.locked || undefined}
                onClick={() => setSelectedId(badge.id)}>
                <BadgeRowFrame className={s.rowFrame} />
                <span className={s.emblem} aria-hidden="true"><BadgeCoreArtwork badgeId={badge.id} /></span>
                <span className={s.copy}>
                  <strong className={s.name}>{badge.name}</strong>
                  <span className={s.effectLabel}>基础效果：</span>
                  <span className={s.effect}>{baseSummary(badge, resourceLabels)}。</span>
                </span>
                {(active || badge.locked) && <span className={s.status}>{active ? "当前选择" : "待开放"}</span>}
              </button>
            );
          })}
          {!badges.length && <p className={s.empty}>暂无可用徽章</p>}
        </div>
        <BadgeScrollRail targetRef={listRef} />
      </div>
      <footer className={s.footer} aria-live="polite">
        {locked ? <p>远征中无法更换徽章</p> : selected?.locked ? <p>{selected.requirement ?? "该徽章尚未开放"}</p>
          : canConfirm ? <>
            <p>{spentPoints > 0 ? `切换将退还 ${spentPoints} 点训练点` : selected?.desc}</p>
            <button type="button" className={s.confirm} onClick={() => selected && onConfirm(selected)}>启用该徽章</button>
          </> : <p>小队徽章决定天赋方向</p>}
      </footer>
    </section>
  );
}
