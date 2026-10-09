// 卡组面板底栏按钮: 放弃(深黑钢 + 古铜细边) / 确认(亮翠绿发光装甲, 两侧双箭头)。
// 底板为可选素材, 未放入时走 CSS 兜底; 禁用态由 CSS 从同一底板派生(去饱和 + 压暗 + 去发光)。
import type { CSSProperties } from "react";
import { DECK_SERVICE_ART } from "@/ui/art/explore/deckServiceArt";
import { ChevronsIcon } from "./deckIcons";
import { BUTTON_ABANDON, BUTTON_CONFIRM, rectStyle } from "./deckGeometry";
import s from "./DeckButton.module.css";

interface Props {
  variant: "abandon" | "confirm";
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export function DeckButton({ variant, label, disabled = false, onClick }: Props) {
  const art = variant === "confirm" ? DECK_SERVICE_ART.buttonConfirm : DECK_SERVICE_ART.buttonAbandon;
  const style = {
    ...rectStyle(variant === "confirm" ? BUTTON_CONFIRM : BUTTON_ABANDON),
    ...(art ? { "--btn-art": `url("${art}")` } : {}),
  } as CSSProperties;
  return (
    <button
      type="button"
      className={s.button}
      data-variant={variant}
      data-art={art ? "" : undefined}
      style={style}
      disabled={disabled}
      onClick={onClick}
    >
      {variant === "confirm" && <ChevronsIcon dir="left" className={s.chevron} />}
      <span className={s.label}>{label}</span>
      {variant === "confirm" && <ChevronsIcon dir="right" className={s.chevron} />}
    </button>
  );
}
