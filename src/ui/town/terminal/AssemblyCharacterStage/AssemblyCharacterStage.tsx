// 「01 角色选择」面板: 上方大立绘舞台, 下方单行缩略图 + 左右箭头。模组装配 / 模组制造两页共用。
import { useEffect, useRef, type KeyboardEvent } from "react";
import { getCharacter } from "@/data";
import { CharacterPortrait } from "@/ui/common/unit/CharacterPortrait";
import { cx } from "@/ui/common/shared/cx";
import { TerminalPanel } from "../TerminalPanel";
import s from "./AssemblyCharacterStage.module.css";

interface Props {
  awakened: string[];
  selected: string;
  onSelect: (charId: string) => void;
  className?: string;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

export function AssemblyCharacterStage({ awakened, selected, onSelect, className }: Props) {
  const selectedId = selected || awakened[0];
  const selectedCharacter = selectedId ? getCharacter(selectedId) : null;
  const selectedIndex = selectedId ? awakened.indexOf(selectedId) : -1;
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  // 缩略图单行排列, 一屏 5 个; 超出的由代码把选中项滚进可视区。
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedId]);

  const step = (delta: number) => {
    const nextIndex = selectedIndex + delta;
    if (selectedIndex < 0 || nextIndex < 0 || nextIndex >= awakened.length) return;
    onSelect(awakened[nextIndex]);
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (!delta) return;
    event.preventDefault();
    step(delta);
  };

  return (
    <TerminalPanel
      index="01"
      title="角色选择"
      deco="OPERATOR"
      rule="none"
      ariaLabel="角色选择"
      className={className}
      bodyClassName={s.body}
    >
      <div className={s.viewport}>
        <span className={s.slashes} aria-hidden="true" />
        {selectedCharacter ? (
          <CharacterPortrait
            characterId={selectedCharacter.id}
            emoji={selectedCharacter.emoji}
            alt={selectedCharacter.name}
            className={s.portrait}
          />
        ) : (
          <span className={s.emptyPortrait} aria-hidden="true" />
        )}
        <div className={s.nameplate}>
          <strong className={s.name}>{selectedCharacter?.name ?? "未选择角色"}</strong>
          {awakened.length > 0 && selectedIndex >= 0 && (
            <span className={s.rank}>
              {pad2(selectedIndex + 1)}
              <i> / </i>
              {pad2(awakened.length)}
            </span>
          )}
        </div>
      </div>
      {awakened.length ? (
        <div className={s.picker}>
          <button
            className={s.arrow}
            type="button"
            aria-label="上一位角色"
            disabled={selectedIndex <= 0}
            onClick={() => step(-1)}
          >
            <ChevronIcon />
          </button>
          <div
            className={s.characterList}
            role="list"
            tabIndex={0}
            aria-label="可用角色"
            onKeyDown={onListKeyDown}
          >
            {awakened.map((id) => {
              const character = getCharacter(id);
              const isSelected = id === selectedId;
              return (
                <button
                  key={id}
                  ref={isSelected ? selectedRef : undefined}
                  className={cx(s.character, isSelected && s.selected)}
                  type="button"
                  role="listitem"
                  aria-label={`选择${character.name}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(id)}
                >
                  <CharacterPortrait characterId={id} emoji={character.emoji} alt="" className={s.thumbnail} />
                </button>
              );
            })}
          </div>
          <button
            className={cx(s.arrow, s.next)}
            type="button"
            aria-label="下一位角色"
            disabled={selectedIndex < 0 || selectedIndex >= awakened.length - 1}
            onClick={() => step(1)}
          >
            <ChevronIcon />
          </button>
        </div>
      ) : (
        <p className={s.empty}>暂无可用角色</p>
      )}
    </TerminalPanel>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3 3 14l9 11" />
    </svg>
  );
}
