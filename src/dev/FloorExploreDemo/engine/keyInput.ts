/** WASD / 方向键的按住状态。窗口失焦时清空, 防止松键事件丢失导致一直走。 */
export interface KeyInput {
  axis(): { right: number; up: number };
  dispose(): void;
}

const UP = new Set(["KeyW", "ArrowUp"]);
const DOWN = new Set(["KeyS", "ArrowDown"]);
const LEFT = new Set(["KeyA", "ArrowLeft"]);
const RIGHT = new Set(["KeyD", "ArrowRight"]);
const ALL = new Set([...UP, ...DOWN, ...LEFT, ...RIGHT]);

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable));
}

export function createKeyInput(): KeyInput {
  const held = new Set<string>();
  const down = (event: KeyboardEvent) => {
    if (!ALL.has(event.code) || isTyping(event.target)) return;
    held.add(event.code);
    event.preventDefault();
  };
  const up = (event: KeyboardEvent) => { held.delete(event.code); };
  const clear = () => held.clear();
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  const has = (codes: Set<string>) => [...codes].some((code) => held.has(code));
  return {
    axis: () => ({
      right: (has(RIGHT) ? 1 : 0) - (has(LEFT) ? 1 : 0),
      up: (has(UP) ? 1 : 0) - (has(DOWN) ? 1 : 0),
    }),
    dispose: () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    },
  };
}
