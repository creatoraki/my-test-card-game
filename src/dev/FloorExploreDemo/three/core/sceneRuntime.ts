import * as THREE from "three";
import { getRoom } from "../../data";
import { crossedDoor, type DoorFrame } from "../../engine/doorGeometry";
import { createKeyInput } from "../../engine/keyInput";
import { buildNavGrid, findPath, type NavGrid } from "../../engine/navGrid";
import { createPlayer, keysToWorld, stepPlayer, type PlayerState } from "../../engine/playerController";
import { buildRoomNav, type RoomNav } from "../../engine/roomNav";
import type { Vec2 } from "../../types";
import { buildExplorer, type ExplorerRig } from "../actors/explorer";
import { animateExplorer, createExplorerPose } from "../actors/explorerAnim";
import { createClickMarker } from "../fx/clickMarker";
import { MaterialKit } from "../materials/materialKit";
import { createPostPipeline, type PostPipeline } from "../postfx/composer";
import { buildRoom, type RoomView } from "../room/buildRoom";
import type { PickInfo } from "../room/buildContext";
import { disposeDecals } from "../textures/decalTextures";
import { BACKGROUND, createEnvironment, createRenderer } from "./createRenderer";
import { FocusTracker, type FocusCallbacks } from "./focusTracker";
import { createIsoCamera, DESIGN_H, DESIGN_W } from "./isoCamera";
import { PointerPick } from "./pointerPick";

export interface RuntimeCallbacks extends FocusCallbacks {
  /** 角色走出某扇门: 由外层盖黑场后调用 loadRoom 进入对面的房间。 */
  onDoor(frame: DoorFrame): void;
}

/**
 * 3D 场景的运行时: 持有渲染器、镜头、后处理、探索者与当前房间, 驱动每帧的
 * 输入 → 移动 → 过门检测 → 动画 → 焦点 → 渲染。与 React 只通过回调和几个方法交互。
 */
export class SceneRuntime {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private iso = createIsoCamera();
  private post: PostPipeline;
  private kit: MaterialKit;
  private env: THREE.Texture;
  private explorer: ExplorerRig;
  private pose = createExplorerPose();
  private keys = createKeyInput();
  private marker = createClickMarker();
  private pick: PointerPick;
  private focus: FocusTracker;
  private pixelRatio = 1;

  private room: RoomView | null = null;
  private nav: RoomNav | null = null;
  private grid: NavGrid | null = null;
  private player: PlayerState = createPlayer({ x: 0, z: 0 }, 0);
  private hover: PickInfo | null = null;
  private blocked = false;
  private travelling = false;
  private frame = 0;
  private last = 0;
  private time = 0;
  private focusPoint = new THREE.Vector3();

  constructor(private canvas: HTMLCanvasElement, private callbacks: RuntimeCallbacks) {
    this.renderer = createRenderer(canvas);
    this.kit = new MaterialKit(Math.min(8, this.renderer.capabilities.getMaxAnisotropy()));
    this.env = createEnvironment(this.renderer);
    this.scene.background = new THREE.Color(BACKGROUND);
    this.scene.environment = this.env;
    this.scene.environmentIntensity = 0.22;
    this.post = createPostPipeline(this.renderer, this.scene, this.iso.camera, DESIGN_W, DESIGN_H);
    this.explorer = buildExplorer(this.kit);
    this.scene.add(this.explorer.root, this.marker.group);
    this.pick = new PointerPick(this.iso.camera);
    this.focus = new FocusTracker(callbacks);
  }

  /** 画布内部分辨率 = 设计尺寸 × 画布缩放 × 设备像素比(上限 2)。 */
  resize(pixelRatio: number): void {
    this.pixelRatio = Math.max(0.5, Math.min(2, pixelRatio));
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(DESIGN_W, DESIGN_H, false);
    this.post.setSize(DESIGN_W, DESIGN_H, this.pixelRatio);
  }

  /** 进入房间: 从 entryDoorId 那扇门进来, 或(首次)站在房间出生点。 */
  loadRoom(roomId: string, entryDoorId: string | null): void {
    if (this.room) {
      this.scene.remove(this.room.group);
      this.room.dispose();
    }
    const def = getRoom(roomId);
    this.room = buildRoom(this.kit, def, this.pixelRatio);
    this.scene.add(this.room.group);
    this.nav = buildRoomNav(def);
    this.grid = buildNavGrid(this.nav);
    const entry = this.nav.doors.find((frame) => frame.door.id === entryDoorId);
    this.player = createPlayer(entry ? entry.spawn : def.spawn, entry ? entry.spawnYaw : def.spawnYaw);
    this.travelling = false;
    this.hover = null;
    this.focus.reset();
    this.marker.hold(false);
    this.syncExplorer();
    this.iso.snap(this.focusTarget());
    // 新房间的着色器提前编译, 揭幕时不卡顿
    this.renderer.compile(this.scene, this.iso.camera);
  }

  setBlocked(blocked: boolean): void {
    this.blocked = blocked;
    if (blocked) this.player.path = [];
  }

  start(): void {
    this.last = performance.now();
    const loop = () => {
      this.frame = requestAnimationFrame(loop);
      this.tick();
    };
    this.frame = requestAnimationFrame(loop);
  }

  pointerMove(ndc: THREE.Vector2): void {
    if (!this.room) return;
    this.hover = this.blocked ? null : this.pick.target(ndc, this.room.pickables);
    this.canvas.style.cursor = this.hover ? "pointer" : "default";
  }

  pointerLeave(): void {
    this.hover = null;
    this.canvas.style.cursor = "default";
  }

  click(ndc: THREE.Vector2): void {
    if (!this.room || !this.nav || !this.grid || this.blocked || this.travelling) return;
    const target = this.pick.target(ndc, this.room.pickables);
    let goal: Vec2 | null = null;
    if (target?.kind === "prop") goal = this.room.props.find((view) => view.def.id === target.id)?.interactPoint ?? null;
    else if (target?.kind === "door") goal = this.nav.doors.find((frame) => frame.door.id === target.id)?.exitPoint ?? null;
    else goal = this.pick.floor(ndc);
    if (!goal) return;
    const path = findPath(this.grid, this.nav, this.player.pos, goal);
    if (!path || !path.length) return;
    this.player.path = path;
    const end = path[path.length - 1];
    this.marker.show(end.x, end.z);
    this.marker.hold(true);
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.keys.dispose();
    if (this.room) {
      this.scene.remove(this.room.group);
      this.room.dispose();
    }
    this.explorer.dispose();
    this.marker.dispose();
    this.post.dispose();
    this.kit.dispose();
    this.env.dispose();
    disposeDecals();
    this.renderer.dispose();
  }

  private tick(): void {
    const now = performance.now();
    const dt = Math.min(1 / 30, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    const t = this.time;
    if (this.room && this.nav) {
      const axis = this.keys.axis();
      const dir = this.blocked || this.travelling ? null : keysToWorld(axis.right, axis.up);
      stepPlayer(this.player, this.nav, dir, dt);
      if (dir) this.marker.hold(false);
      if (!this.player.path.length) this.marker.hold(false);
      if (!this.travelling && !this.blocked) {
        const door = crossedDoor(this.nav.doors, this.player.pos);
        if (door) {
          this.travelling = true;
          this.player.path = [];
          this.callbacks.onDoor(door);
        }
      }
      this.syncExplorer();
      animateExplorer(this.explorer, this.pose, this.player.speed, t, dt);
      this.room.update(t, dt);
      this.marker.update(dt);
      this.iso.follow(this.focusTarget(), dt);
      this.focus.update(this.room, this.player.pos, this.hover, this.iso.camera);
    }
    this.post.render(t);
  }

  private syncExplorer(): void {
    this.explorer.root.position.set(this.player.pos.x, 0, this.player.pos.z);
    this.explorer.root.rotation.y = this.player.yaw;
  }

  private focusTarget(): THREE.Vector3 {
    return this.focusPoint.set(this.player.pos.x, 0.8, this.player.pos.z);
  }
}
