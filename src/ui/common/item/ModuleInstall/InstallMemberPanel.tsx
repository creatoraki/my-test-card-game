// 装配弹窗「01 角色选择」: 竖排角色条(半身缩略 + 名字 + 附注), 阵亡等不可选的列出但置灰。
import { getCharacter } from "@/data";
import { TerminalPanel } from "@/ui/common/frame/TerminalPanel";
import { cx } from "@/ui/common/shared/cx";
import { CharacterPortrait } from "@/ui/common/unit/CharacterPortrait";
import type { InstallMember } from "./ModuleInstallDialog";
import s from "./InstallMemberPanel.module.css";

interface Props {
  members: readonly InstallMember[];
  selected: string;
  onSelect: (charId: string) => void;
}

export function InstallMemberPanel({ members, selected, onSelect }: Props) {
  return (
    <TerminalPanel
      index="01"
      title="角色选择"
      deco="OPERATOR"
      extra={`${members.length} 人`}
      ariaLabel="选择装配角色"
      bodyClassName={s.body}
    >
      {members.length ? (
        <div className={s.list} role="list">
          {members.map((member) => {
            const character = getCharacter(member.charId);
            const isSelected = member.charId === selected;
            return (
              <button
                key={member.charId}
                className={cx(s.member, isSelected && s.selected)}
                type="button"
                role="listitem"
                disabled={member.disabled}
                aria-pressed={isSelected}
                onClick={() => onSelect(member.charId)}
              >
                <span className={s.avatar} aria-hidden="true">
                  <CharacterPortrait characterId={member.charId} emoji={character.emoji} alt="" className={s.thumb} />
                </span>
                <span className={s.info}>
                  <strong className={s.name}>{character.name}</strong>
                  {member.tag && <span className={s.tag}>{member.tag}</span>}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className={s.empty}>暂无可用角色</p>
      )}
    </TerminalPanel>
  );
}
