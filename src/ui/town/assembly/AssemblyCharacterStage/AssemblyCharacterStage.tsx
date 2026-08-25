import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { getCharacter } from "@/data";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { cx } from "@/ui/common/cx";
import s from "./AssemblyCharacterStage.module.css";

interface Props {
  awakened: string[];
  selected: string;
  onSelect: (charId: string) => void;
}

export function AssemblyCharacterStage({ awakened, selected, onSelect }: Props) {
  const selectedId = selected || awakened[0];
  const selectedCharacter = selectedId ? getCharacter(selectedId) : null;
  const selectedIndex = selectedId ? awakened.indexOf(selectedId) : -1;
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  // 缩略条改成一条横向滚动的胶片, 选中项由代码滚进可视区 —— 顶掉了原来那套分页按钮 + 「01 / 02」指示器。
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedId]);

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (selectedIndex < 0) return;
    const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (!step) return;
    const nextIndex = selectedIndex + step;
    if (nextIndex < 0 || nextIndex >= awakened.length) return;
    event.preventDefault();
    onSelect(awakened[nextIndex]);
  };

  return (
    <aside className={s.stage} aria-label="角色选择">
      <div className={s.viewport} style={{ "--character-color": selectedCharacter?.color } as CSSProperties}>
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
            <span className={s.rank}>{selectedIndex + 1} / {awakened.length}</span>
          )}
        </div>
      </div>
      {awakened.length ? (
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
                style={{ "--character-color": character.color } as CSSProperties}
              >
                <CharacterPortrait
                  characterId={id}
                  emoji={character.emoji}
                  alt=""
                  className={s.thumbnail}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <p className={s.empty}>暂无可用角色</p>
      )}
    </aside>
  );
}
