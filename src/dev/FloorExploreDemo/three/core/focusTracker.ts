import * as THREE from "three";
import { getRoom, STRUCTURE } from "../../data";
import type { Vec2 } from "../../types";
import type { RoomView } from "../room/buildRoom";
import type { PickInfo } from "../room/buildContext";
import { DESIGN_H, DESIGN_W } from "./isoCamera";

/** HUD 标签要显示的焦点: 靠近 / 悬停的物体, 或悬停的门。 */
export interface FocusInfo {
  key: string;
  kind: "prop" | "door";
  title: string;
  hint: string;
}

export interface FocusCallbacks {
  onFocus(info: FocusInfo | null): void;
  /** 标签锚点的画布坐标(设计 px)。 */
  onLabelMove(x: number, y: number): void;
}

const NEAR = 1.35;

/**
 * 决定当前焦点(悬停优先, 其次是角色附近的物体), 点亮对应物体的提示光圈,
 * 并把锚点投影到画布坐标交给 HUD。只在焦点变化时回调 onFocus, 位置每帧直写。
 */
export class FocusTracker {
  private current: string | null = null;
  private anchor = new THREE.Vector3();
  private projected = new THREE.Vector3();

  constructor(private callbacks: FocusCallbacks) {}

  update(room: RoomView, player: Vec2, hover: PickInfo | null, camera: THREE.Camera): void {
    let near: string | null = null;
    let best = NEAR;
    for (const view of room.props) {
      const d = Math.hypot(view.interactPoint.x - player.x, view.interactPoint.z - player.z);
      if (d < best) { best = d; near = view.def.id; }
    }
    const focusKey = hover ? `${hover.kind}:${hover.id}` : near ? `prop:${near}` : null;
    for (const view of room.props) {
      view.highlight.setFocus(view.def.id === near || (hover?.kind === "prop" && hover.id === view.def.id));
    }

    if (focusKey !== this.current) {
      this.current = focusKey;
      this.callbacks.onFocus(this.describe(room, focusKey));
    }
    if (!focusKey) return;
    if (!this.locate(room, focusKey)) return;
    this.projected.copy(this.anchor).project(camera);
    this.callbacks.onLabelMove((this.projected.x + 1) / 2 * DESIGN_W, (1 - this.projected.y) / 2 * DESIGN_H);
  }

  reset(): void {
    if (this.current === null) return;
    this.current = null;
    this.callbacks.onFocus(null);
  }

  private describe(room: RoomView, key: string | null): FocusInfo | null {
    if (!key) return null;
    const [kind, id] = key.split(":") as ["prop" | "door", string];
    if (kind === "prop") {
      const view = room.props.find((item) => item.def.id === id);
      return view ? { key, kind, title: view.info.name, hint: view.info.verb } : null;
    }
    const door = room.room.doors.find((item) => item.id === id);
    return door ? { key, kind, title: getRoom(door.to.roomId).name, hint: "通往" } : null;
  }

  private locate(room: RoomView, key: string): boolean {
    const [kind, id] = key.split(":");
    if (kind === "prop") {
      const view = room.props.find((item) => item.def.id === id);
      if (!view) return false;
      this.anchor.copy(view.anchor);
      return true;
    }
    const door = room.room.doors.find((item) => item.id === id);
    if (!door) return false;
    const r = room.room;
    const x = door.side === "x0" ? 0 : door.side === "x1" ? r.width : door.offset;
    const z = door.side === "z0" ? 0 : door.side === "z1" ? r.depth : door.offset;
    const back = door.side === "x0" || door.side === "z0";
    this.anchor.set(x, back ? STRUCTURE.doorHeight + 0.7 : 1.3, z);
    return true;
  }
}
