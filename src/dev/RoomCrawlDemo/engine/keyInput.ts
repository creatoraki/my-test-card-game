/** 按键状态: WASD / 方向键为按住型, 空格 / E / F2 为按下触发型(由逻辑帧消费一次)。 */
export interface KeyInput {
  /** right: 右正左负; down: 向前(靠近镜头)为正, 向后墙为负。 */
  axis(): { right: number; down: number };
  running(): boolean;
  /** 本帧之前是否按下过该动作键; 读取后清除。 */
  consume(action: KeyAction): boolean;
  /** 丢弃所有未消费的按下与按住状态(打开弹窗、切换房间时调用)。 */
  reset(): void;
  dispose(): void;
}

export type KeyAction = "jump" | "interact" | "debug";

const UP = new Set(["KeyW", "ArrowUp"]);
const DOWN = new Set(["KeyS", "ArrowDown"]);
const LEFT = new Set(["KeyA", "ArrowLeft"]);
const RIGHT = new Set(["KeyD", "ArrowRight"]);
const RUN = new Set(["ShiftLeft", "ShiftRight"]);
const HOLD = new Set([...UP, ...DOWN, ...LEFT, ...RIGHT, ...RUN]);
const ACTIONS: Record<string, KeyAction> = { Space: "jump", KeyE: "interact", F2: "debug" };

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable));
}

export function createKeyInput(): KeyInput {
  const held = new Set<string>();
  const pressed = new Set<KeyAction>();
  const down = (event: KeyboardEvent) => {
    if (isTyping(event.target)) return;
    const action = ACTIONS[event.code];
    if (action) {
      if (!event.repeat) pressed.add(action);
      event.preventDefault();
      return;
    }
    if (!HOLD.has(event.code)) return;
    held.add(event.code);
    event.preventDefault();
  };
  const up = (event: KeyboardEvent) => { held.delete(event.code); };
  const clear = () => { held.clear(); pressed.clear(); };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  const has = (codes: Set<string>) => [...codes].some((code) => held.has(code));
  return {
    axis: () => ({
      right: (has(RIGHT) ? 1 : 0) - (has(LEFT) ? 1 : 0),
      down: (has(DOWN) ? 1 : 0) - (has(UP) ? 1 : 0),
    }),
    running: () => has(RUN),
    consume: (action) => {
      const hit = pressed.has(action);
      pressed.delete(action);
      return hit;
    },
    reset: clear,
    dispose: () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    },
  };
}
