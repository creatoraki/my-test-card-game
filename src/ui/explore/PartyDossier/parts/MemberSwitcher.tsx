// 左栏底部: 队员切换条。一排缩略立绘 + 左右箭头 + 页码圆点, 阵亡队员压灰但仍可查看。
// ★ 只发出「选谁」, 面板的页签与浮层状态由 PartyDossier 持有, 换人时不重置。
import { CharacterPortrait } from "@/ui/common/unit/CharacterPortrait";
import { cx } from "@/ui/common/shared/cx";
import s from "./MemberSwitcher.module.css";

export interface SwitcherMember {
  charId: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  alive: boolean;
}

interface Props {
  members: SwitcherMember[];
  selected: string;
  onSelect: (charId: string) => void;
}

export function MemberSwitcher({ members, selected, onSelect }: Props) {
  const index = members.findIndex((member) => member.charId === selected);
  const step = (delta: number) => {
    const next = members[index + delta];
    if (next) onSelect(next.charId);
  };

  return (
    <div className={s.switcher}>
      <button type="button" className={s.arrow} aria-label="上一名队员" disabled={index <= 0} onClick={() => step(-1)}>
        <ChevronIcon />
      </button>
      <div className={s.list} role="tablist" aria-label="切换队员">
        {members.map((member) => {
          const active = member.charId === selected;
          const hpPct = Math.max(0, Math.min(100, (member.hp / Math.max(1, member.maxHp)) * 100));
          return (
            <button
              key={member.charId}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${member.name}${member.alive ? "" : "（阵亡）"}`}
              className={cx(s.member, active && s.active)}
              data-down={member.alive ? undefined : ""}
              onClick={() => onSelect(member.charId)}
            >
              <CharacterPortrait characterId={member.charId} emoji={member.emoji} alt="" className={s.thumb} />
              <span className={s.hp} aria-hidden="true">
                <i style={{ width: `${hpPct}%` }} />
              </span>
              {!member.alive && <span className={s.downTag}>阵亡</span>}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className={cx(s.arrow, s.next)}
        aria-label="下一名队员"
        disabled={index < 0 || index >= members.length - 1}
        onClick={() => step(1)}
      >
        <ChevronIcon />
      </button>
      <div className={s.dots} aria-hidden="true">
        {members.map((member) => (
          <i key={member.charId} data-on={member.charId === selected || undefined} />
        ))}
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3 3 14l9 11" />
    </svg>
  );
}
