import { useEffect, useRef, type KeyboardEvent } from "react";

interface UseDialogFocusOptions {
  active: boolean;
  onEscape: () => void;
}

/** 事件浮层共用的焦点收束：遮罩期间保留原焦点，活动期间只在面板按钮间循环。 */
export function useDialogFocus({ active, onEscape }: UseDialogFocusOptions) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    element.inert = !active;
    if (active) element.focus();
  }, [active]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!active) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      onEscape();
      return;
    }
    if (event.key !== "Tab") return;

    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
    if (!buttons.length) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return { panel, onKeyDown };
}
