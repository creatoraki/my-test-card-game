import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import s from "./ItemContextMenu.module.css";

export interface ContextMenuItem {
  key: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface ItemContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  themeStyle?: CSSProperties;
}

const MENU_WIDTH = 148;
const MENU_GAP = 12;

export default function ItemContextMenu({ x, y, items, onClose, themeStyle }: ItemContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const handleClose = () => onClose();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("wheel", handleClose, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("blur", handleClose);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("wheel", handleClose, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("blur", handleClose);
      window.removeEventListener("resize", handleClose);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const estimatedHeight = items.length * 34 + 10;
  const left =
    x + MENU_WIDTH <= window.innerWidth - MENU_GAP
      ? x
      : Math.max(MENU_GAP, x - MENU_WIDTH);
  const top = Math.min(
    Math.max(MENU_GAP, y),
    Math.max(MENU_GAP, window.innerHeight - estimatedHeight - MENU_GAP),
  );

  return createPortal(
    <div
      ref={menuRef}
      className={s["context-menu"]}
      style={{ ...themeStyle, left: `${left}px`, top: `${top}px` }}
      role="menu"
      aria-label="物品操作"
    >
      {items.map((item) => (
        <button
          key={item.key}
          className={item.danger ? s["context-menu-item-danger"] : undefined}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
