import { useEffect, useRef } from "react";
import type { InputState } from "../types";

const LEFT = new Set(["KeyA", "ArrowLeft"]);
const RIGHT = new Set(["KeyD", "ArrowRight"]);
const JUMP = new Set(["Space", "KeyW", "ArrowUp"]);

/** 键盘输入写入 ref，由游戏循环按帧读取；跳跃额外记录按下沿供跳跃缓冲使用。 */
export function useKeyboard() {
  const input = useRef<InputState>({ left: false, right: false, jumpHeld: false, jumpPressed: false });

  useEffect(() => {
    const state = input.current;
    const apply = (code: string, down: boolean) => {
      if (LEFT.has(code)) state.left = down;
      else if (RIGHT.has(code)) state.right = down;
      else if (JUMP.has(code)) {
        if (down && !state.jumpHeld) state.jumpPressed = true;
        state.jumpHeld = down;
      } else return false;
      return true;
    };
    const onDown = (event: KeyboardEvent) => {
      if (apply(event.code, true)) event.preventDefault();
    };
    const onUp = (event: KeyboardEvent) => {
      if (apply(event.code, false)) event.preventDefault();
    };
    const release = () => {
      state.left = false;
      state.right = false;
      state.jumpHeld = false;
      state.jumpPressed = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", release);
    };
  }, []);

  return input;
}
