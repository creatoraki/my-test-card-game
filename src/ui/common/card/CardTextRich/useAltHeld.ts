import { useSyncExternalStore } from "react";

let held = false;
const listeners = new Set<() => void>();
function update(next: boolean) {
  if (held === next) return;
  held = next;
  // 通知期间组件可能重新订阅，使用快照避免遍历正在变化的集合。
  [...listeners].forEach((listener) => listener());
}
function key(event: KeyboardEvent) {
  // 单独按 ALT 会触发浏览器菜单并转移焦点；详情切换由页面接管。
  if (event.key === "Alt") {
    event.preventDefault();
    update(event.type === "keydown" || event.altKey);
    return;
  }
  update(event.altKey);
}
function reset() { update(false); }
function visibility() { if (document.hidden) reset(); }
function subscribe(listener: () => void) {
  if (!listeners.size) {
    window.addEventListener("keydown", key, true);
    window.addEventListener("keyup", key, true);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibility);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("keyup", key, true);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibility);
    }
  };
}
export function useAltHeld() { return useSyncExternalStore(subscribe, () => held, () => false); }
