import { ChevronsIcon, CraftEmblem } from "./craftIcons";
import s from "./CraftButton.module.css";

interface Props {
  disabled: boolean;
  onClick: () => void;
}

/** 制造详情底部的主按钮: 红色发光板 + 徽标 + 「制造」+ 双箭头。 */
export function CraftButton({ disabled, onClick }: Props) {
  return (
    <button className={s.button} type="button" disabled={disabled} onClick={onClick} aria-label="制造选中的模组">
      <span className={s.emblem}>
        <CraftEmblem />
      </span>
      <span className={s.label}>
        <strong>制造</strong>
        <small aria-hidden="true">MANUFACTURE</small>
      </span>
      <span className={s.chevrons}>
        <ChevronsIcon />
      </span>
    </button>
  );
}
