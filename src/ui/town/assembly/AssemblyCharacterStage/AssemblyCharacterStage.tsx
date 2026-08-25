import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import { getCharacter } from "@/data";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { cx } from "@/ui/common/cx";
import { ArrowLeftIcon, ArrowRightIcon } from "../AssemblyScene/icons";
import s from "./AssemblyCharacterStage.module.css";

const PAGE_SIZE = 3;

interface Props {
  awakened: string[];
  selected: string;
  onSelect: (charId: string) => void;
}

export function AssemblyCharacterStage({ awakened, selected, onSelect }: Props) {
  const selectedId = selected || awakened[0];
  const selectedCharacter = selectedId ? getCharacter(selectedId) : null;
  const pageCount = Math.max(1, Math.ceil(awakened.length / PAGE_SIZE));
  const selectedIndex = selectedId ? awakened.indexOf(selectedId) : -1;
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (selectedIndex >= 0) setPage(Math.floor(selectedIndex / PAGE_SIZE));
    else setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount, selectedIndex]);

  const currentPage = Math.min(page, pageCount - 1);
  const pageCharacters = awakened.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const goToPage = (nextPage: number) => setPage(Math.max(0, Math.min(nextPage, pageCount - 1)));
  const onNavigationKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" && currentPage > 0) {
      event.preventDefault();
      goToPage(currentPage - 1);
    } else if (event.key === "ArrowRight" && currentPage < pageCount - 1) {
      event.preventDefault();
      goToPage(currentPage + 1);
    }
  };

  return (
    <aside className={s.stage} aria-label="角色选择">
      <div className={s.viewport} style={{ "--character-color": selectedCharacter?.color } as CSSProperties}>
        <span className={s.viewportGrid} aria-hidden="true" />
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
        <span className={s.viewportMarker} aria-hidden="true" />
      </div>
      <div className={s.heading}>
        <span className={s.kicker}>CURRENT OPERATOR</span>
        <strong>{selectedCharacter?.name ?? "未选择角色"}</strong>
      </div>
      <div className={s.characterNav} onKeyDown={onNavigationKeyDown} aria-label="角色分页">
        <div className={s.pagination}>
          <button
            className={s.pageButton}
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="上一页角色"
          >
            <ArrowLeftIcon />
          </button>
          <span className={s.pageIndicator} aria-live="polite">
            {String(currentPage + 1).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}
          </span>
          <button
            className={s.pageButton}
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
            aria-label="下一页角色"
          >
            <ArrowRightIcon />
          </button>
        </div>
        <div className={s.characterList} role="list" tabIndex={0} aria-label="可用角色">
        {pageCharacters.map((id) => {
          const character = getCharacter(id);
          const isSelected = id === selectedId;
          return (
            <button
              key={id}
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
              <span className={s.index}>{String(awakened.indexOf(id) + 1).padStart(2, "0")}</span>
            </button>
          );
        })}
        </div>
      </div>
      {!awakened.length && <p className={s.empty}>暂无可用角色</p>}
    </aside>
  );
}