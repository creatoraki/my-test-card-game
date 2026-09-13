import { useEffect, useRef, useState } from "react";
import { clampCorridorX, nearbyObjects } from "@/explore/corridor/session";
import { CORRIDOR, type CorridorState } from "@/explore/corridor/types";
import { encounterCorridorThreat, inspectCorridorObject, saveCorridorPosition } from "@/store/exploreCorridor";

export function useCorridorMovement(corridor: CorridorState, blocked: boolean) {
  const [motion, setMotion] = useState({ x: corridor.playerX, facing: corridor.facing, walking: false });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const live = useRef({ corridor, blocked });
  live.current = { corridor, blocked };
  const position = useRef(motion);
  const selected = useRef(selectedId);
  selected.current = selectedId;
  const pressed = useRef(new Set<string>());
  const pointerDirection = useRef(0);

  const save = () => {
    const value = position.current;
    saveCorridorPosition(value.x, value.facing, live.current.corridor.round);
  };
  const stop = () => {
    pressed.current.clear();
    pointerDirection.current = 0;
    position.current = { ...position.current, walking: false };
    setMotion(position.current);
    save();
  };
  const interact = (id?: string) => {
    if (live.current.blocked) return;
    const near = nearbyObjects(live.current.corridor, position.current.x);
    const object = near.find((item) => item.id === (id ?? selected.current)) ?? (!id ? near[0] : undefined);
    if (!object) return;
    stop();
    inspectCorridorObject(object.id);
  };
  const cycle = (direction: number) => {
    const near = nearbyObjects(live.current.corridor, position.current.x);
    if (!near.length) return;
    const index = Math.max(0, near.findIndex((item) => item.id === selected.current));
    setSelectedId(near[(index + direction + near.length) % near.length].id);
  };

  useEffect(() => {
    if (blocked) stop();
    // 暂停只清输入；保存位置的 store 操作会自行校验会话阶段。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked]);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      const current = live.current;
      const menuOpen = Boolean(document.querySelector("[role='menu']"));
      if (menuOpen && (pressed.current.size || pointerDirection.current)) stop();
      if (!current.blocked && !document.hidden && !menuOpen) {
        const keys = pressed.current;
        const direction = pointerDirection.current || Number(keys.has("ArrowRight") || keys.has("KeyD")) - Number(keys.has("ArrowLeft") || keys.has("KeyA"));
        if (direction) {
          const x = clampCorridorX(current.corridor, position.current.x + direction * CORRIDOR.speed * elapsed);
          position.current = { x, facing: direction < 0 ? -1 : 1, walking: x !== position.current.x };
          setMotion(position.current);
          const threat = current.corridor.threats.find((item) => !item.defeated && Math.abs(item.x - x) <= CORRIDOR.encounterRadius);
          if (threat) {
            save();
            pressed.current.clear();
            pointerDirection.current = 0;
            encounterCorridorThreat(threat.id);
          }
        } else if (position.current.walking) {
          position.current = { ...position.current, walking: false };
          setMotion(position.current);
          save();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || live.current.blocked || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog'], [role='menu']") || document.querySelector("[role='menu']")) return;
      if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)) {
        event.preventDefault();
        if (target?.closest("button, a")) target.blur();
        pressed.current.add(event.code);
      } else if (["ArrowUp", "ArrowDown", "KeyW", "KeyS"].includes(event.code)) {
        event.preventDefault();
        if (target?.closest("button, a")) target.blur();
        if (!event.repeat) cycle(event.code === "ArrowUp" || event.code === "KeyW" ? -1 : 1);
      } else if (["Space", "Enter"].includes(event.code) && !target?.closest("button, a")) {
        event.preventDefault();
        if (!event.repeat) interact();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressed.current.delete(event.code);
      if (!pressed.current.size) save();
    };
    const onVisibility = () => { if (document.hidden) stop(); };
    frame = requestAnimationFrame(tick);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onVisibility);
      save();
    };
    // 监听器通过 ref 读取实时状态，不随行走帧重新绑定。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearby = nearbyObjects(corridor, motion.x);
  const target = nearby.find((item) => item.id === selectedId) ?? nearby[0] ?? null;
  return {
    ...motion, nearby, target, interact, cycle, stop,
    startPointer: (direction: number) => { if (!live.current.blocked) pointerDirection.current = direction; },
  };
}
