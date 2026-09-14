import { useEffect, useRef, useState } from "react";
import { clampCorridorX, nearbyObjects, portalAt } from "@/explore/corridor/session";
import { CORRIDOR, type CorridorState } from "@/explore/corridor/types";
import type { PortalDir } from "@/explore/dungeon/types";
import {
  encounterCorridorThreat, inspectCorridorObject, markStandingPortal,
  saveCorridorPosition, travelThroughPortal,
} from "@/store/exploreCorridor";

type PortalTravel = (travel: () => boolean) => void;

/**
 * 房间内的行走与交互。
 * 操作: ←/→ 或 A/D 行走；↑/W、空格、回车 = 交互（脚下有传送门时优先传送）；↓/S 循环切目标。
 * 站到传送门上只是点亮小地图，必须再按一次交互键才真的传送。
 */
export function useCorridorMovement(corridor: CorridorState, blocked: boolean, onPortalTravel: PortalTravel) {
  const [motion, setMotion] = useState({ x: corridor.playerX, facing: corridor.facing, walking: false });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [interactingId, setInteractingId] = useState<string | null>(null);
  const live = useRef({ corridor, blocked });
  live.current = { corridor, blocked };
  const position = useRef(motion);
  const selected = useRef(selectedId);
  selected.current = selectedId;
  const pressed = useRef(new Set<string>());
  // 脚下传送门只在「换了一扇门」时提交，避免每帧克隆整个会话。
  const standingDir = useRef<string | null>(corridor.standingPortalDir);

  const save = () => {
    const value = position.current;
    saveCorridorPosition(value.x, value.facing, live.current.corridor.roomId);
  };
  const syncPortal = () => {
    const current = live.current;
    const dir = current.blocked ? null : portalAt(current.corridor, position.current.x)?.dir ?? null;
    if (standingDir.current === dir) return;
    standingDir.current = dir;
    markStandingPortal(position.current.x);
  };
  const stop = () => {
    pressed.current.clear();
    position.current = { ...position.current, walking: false };
    setMotion(position.current);
    save();
    syncPortal();
  };
  const travel = (dir: PortalDir) => {
    if (live.current.blocked) return;
    stop(); // 先把位置提交上去：传送判定读的是会话里的坐标
    if (portalAt(live.current.corridor, position.current.x)?.dir !== dir) return;
    onPortalTravel(() => travelThroughPortal(dir));
  };
  const interact = (id?: string) => {
    if (live.current.blocked) return;
    // 脚下有传送门时，交互键就是「确认传送」。
    const portal = portalAt(live.current.corridor, position.current.x);
    if (portal && !id) {
      travel(portal.dir);
      return;
    }
    const near = nearbyObjects(live.current.corridor, position.current.x);
    const object = near.find((item) => item.id === (id ?? selected.current)) ?? (!id ? near[0] : undefined);
    if (!object) return;
    stop();
    setInteractingId(object.id);
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
    if (!interactingId) return;
    const timer = window.setTimeout(() => setInteractingId(null), 1050);
    return () => window.clearTimeout(timer);
  }, [interactingId]);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      const current = live.current;
      const menuOpen = Boolean(document.querySelector("[role='menu']"));
      if (menuOpen && pressed.current.size) stop();
      if (!current.blocked && !document.hidden && !menuOpen) {
        const keys = pressed.current;
        const direction = Number(keys.has("ArrowRight") || keys.has("KeyD")) - Number(keys.has("ArrowLeft") || keys.has("KeyA"));
        if (direction && elapsed > 0) {
          const x = clampCorridorX(current.corridor, position.current.x + direction * CORRIDOR.speed * elapsed);
          position.current = { x, facing: direction < 0 ? -1 : 1, walking: x !== position.current.x };
          setMotion(position.current);
          syncPortal();
          const threat = current.corridor.threats.find((item) => !item.defeated && Math.abs(item.x - x) <= CORRIDOR.encounterRadius);
          if (threat) {
            save();
            pressed.current.clear();
            encounterCorridorThreat(threat.id);
          }
        } else if (!direction && position.current.walking) {
          position.current = { ...position.current, walking: false };
          setMotion(position.current);
          save();
          syncPortal();
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
      } else if (["ArrowDown", "KeyS"].includes(event.code)) {
        event.preventDefault();
        if (target?.closest("button, a")) target.blur();
        if (!event.repeat) cycle(1);
      } else if (["ArrowUp", "KeyW", "Space", "Enter"].includes(event.code)) {
        // ↑ / W 与空格、回车等价：房间内目标较少，交互键多一个更顺手。
        if (["Space", "Enter"].includes(event.code) && target?.closest("button, a")) return;
        event.preventDefault();
        if (target?.closest("button, a")) target.blur();
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
    syncPortal();
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
  const standingPortal = blocked ? null : portalAt(corridor, motion.x);
  const target = standingPortal ? null : nearby.find((item) => item.id === selectedId) ?? nearby[0] ?? null;
  return { ...motion, nearby, target, standingPortal, interactingId, interact, cycle, travel };
}
