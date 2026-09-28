import type { DoorDef, EncounterChoice, PropDef } from "../types";
import { CrawlWorld } from "./crawlWorld";
import { findDoorHit } from "./doorTrigger";
import { stepGuard } from "./guardBrain";
import { HeroAnimator, type GaitTable } from "./heroAnimator";
import { pickFocus, searchProgress, stepSearch, type SearchRun } from "./interaction";
import type { KeyInput } from "./keyInput";
import { knockBack, speedRatio, stepPlayer } from "./playerMotion";
import { ScrollCamera } from "./scrollCamera";
import { damp } from "./springBone";

const IRIS_CLOSE = 0.42;
const IRIS_OPEN = 0.62;
const ENCOUNTER_DELAY = 0.55;

/** loading: 黑幕中等待渲染层加载房间(编译 + 烘焙), 由 releaseLoad() 放行。 */
export type Phase = "play" | "irisOut" | "irisIn" | "encounter" | "retreatOut" | "loading";

/** 一帧里发生的事, 交给渲染层与 React 处理。 */
export interface FrameEvents {
  roomChanged: boolean;
  focusChanged: boolean;
  loot: PropDef | null;
  searchDone: PropDef | null;
  encounter: string | null;
  debugToggled: boolean;
  landed: boolean;
  banished: string | null;
}

function emptyEvents(): FrameEvents {
  return { roomChanged: false, focusChanged: false, loot: null, searchDone: null, encounter: null, debugToggled: false, landed: false, banished: null };
}

/**
 * 纯逻辑总调度: 输入 → 玩家 / 守卫 / 调查 / 过门 / 遭遇的状态机, 以及相机与角色动画。
 * 渲染层只读取这里的状态并按 FrameEvents 做表现。
 */
export class CrawlDirector {
  readonly world = new CrawlWorld();
  readonly animator: HeroAnimator;
  readonly camera: ScrollCamera;
  phase: Phase = "loading";
  /** 虹膜开合 0~1。 */
  iris = 0;
  /** 遭遇冲击强度 0~1(后处理用)。 */
  impact = 0;
  focus: PropDef | null = null;
  search: SearchRun | null = null;
  debug = false;
  blocked = false;
  private pendingDoor: DoorDef | null = null;
  private encounterGuard: string | null = null;
  private phaseT = 0;

  constructor(private input: KeyInput, gait: GaitTable) {
    const p = this.world.player;
    this.animator = new HeroAnimator(gait, p.facing);
    this.camera = new ScrollCamera(this.world.room.width);
    this.camera.snap(this.world.room.width, p.x, p.facing);
  }

  searchProgressOf(propId: string): number | null {
    return this.search && this.search.prop.id === propId ? searchProgress(this.search) : null;
  }

  step(dt: number): FrameEvents {
    const ev = emptyEvents();
    this.phaseT += dt;
    if (this.input.consume("debug")) {
      this.debug = !this.debug;
      ev.debugToggled = true;
    }
    const frozen = this.blocked || this.phase === "encounter" || this.phase === "loading";
    if (!frozen) this.stepPlay(dt, ev);
    this.stepPhase(ev);
    this.impact = damp(this.impact, this.phase === "encounter" ? 1 : 0, this.phase === "encounter" ? 9 : 4, dt);
    const p = this.world.player;
    this.camera.update(dt, p.x, p.facing, speedRatio(p));
    return ev;
  }

  private stepPlay(dt: number, ev: FrameEvents): void {
    const w = this.world;
    const p = w.player;
    const canAct = this.phase === "play" && !this.search;
    const axis = canAct ? this.input.axis() : { right: 0, down: 0 };
    const jump = canAct && this.input.consume("jump");
    const interact = this.input.consume("interact");
    const px = p.x;
    const pz = p.z;
    const res = stepPlayer(p, { right: axis.right, down: axis.down, jump }, dt, w.room.width, w.blockers);
    ev.landed = res.landed;
    const travel = Math.hypot(p.x - px, p.z - pz);
    this.animator.update({ dt, travel, vx: p.vx, vh: p.vh, speed: speedRatio(p), facing: p.facing, jump: p.jump, phaseT: p.phaseT, knocked: p.knock > 0 });

    for (const g of w.guards) {
      if (this.phase !== "play") break;
      if (stepGuard(g, dt, p) === "contact") {
        this.phase = "encounter";
        this.phaseT = 0;
        this.encounterGuard = g.id;
        this.search = null;
        this.camera.shake(14);
        break;
      }
    }
    w.sweepGuards();

    if (this.search) {
      const r = stepSearch(this.search, dt);
      if (r.loot) ev.loot = this.search.prop;
      if (r.done) {
        w.markSearched(this.search.prop.id);
        ev.searchDone = this.search.prop;
        this.search = null;
      }
    }

    const focus = canAct && p.jump !== "air" ? pickFocus(w.room.props, w.searched, p.x, p.z) : null;
    if (focus !== this.focus) {
      this.focus = focus;
      ev.focusChanged = true;
    }
    if (interact && focus && canAct) {
      this.search = { prop: focus, t: 0, lootFired: false };
      p.vx = 0;
      p.vz = 0;
      p.facing = focus.x >= p.x ? 1 : -1;
      this.focus = null;
      ev.focusChanged = true;
    }

    if (this.phase === "play") this.checkDoors(axis.right, axis.down);
  }

  /** 穿过未上锁的门: 收拢虹膜准备换房间。 */
  private checkDoors(right: number, down: number): void {
    const w = this.world;
    const p = w.player;
    const hit = findDoorHit(w.room, p.x, p.z, right, down);
    if (!hit || w.locked) return;
    this.pendingDoor = hit;
    this.phase = "irisOut";
    this.phaseT = 0;
  }

  private stepPhase(ev: FrameEvents): void {
    switch (this.phase) {
      case "irisOut":
      case "retreatOut":
        this.iris = Math.max(0, 1 - this.phaseT / IRIS_CLOSE);
        if (this.iris <= 0) this.finishClose(ev);
        break;
      case "loading":
        this.iris = 0;
        break;
      case "irisIn":
        this.iris = Math.min(1, this.phaseT / IRIS_OPEN);
        if (this.iris >= 1) {
          this.phase = "play";
          this.phaseT = 0;
        }
        break;
      case "encounter":
        if (this.encounterGuard && this.phaseT >= ENCOUNTER_DELAY) {
          ev.encounter = this.encounterGuard;
          this.encounterGuard = null;
        }
        break;
      default:
        this.iris = 1;
    }
  }

  private finishClose(ev: FrameEvents): void {
    const w = this.world;
    if (this.phase === "irisOut" && this.pendingDoor) {
      w.enter(this.pendingDoor.to, this.pendingDoor.side);
      this.pendingDoor = null;
      ev.roomChanged = true;
    } else {
      // 后撤: 回到本房间入口, 守卫回巡逻起点
      const e = w.entry;
      Object.assign(w.player, { x: e.x, z: e.z, h: 0, vx: 0, vz: 0, vh: 0, facing: e.facing, jump: "ground", knock: 0 });
      w.resetGuards();
    }
    const p = w.player;
    this.animator.snap(p.facing);
    this.camera.snap(w.room.width, p.x, p.facing);
    this.input.reset();
    this.focus = null;
    this.search = null;
    ev.focusChanged = true;
    // 换了房间就在黑幕里等渲染层加载完; 后撤仍在本房间, 直接展开
    this.phase = ev.roomChanged ? "loading" : "irisIn";
    this.phaseT = 0;
  }

  /** 渲染层把房间加载好后调用: 从黑幕展开虹膜。 */
  releaseLoad(): void {
    if (this.phase !== "loading") return;
    this.input.reset();
    this.phase = "irisIn";
    this.phaseT = 0;
  }

  /** 遭遇提示卡的选择。 */
  resolveEncounter(guardId: string, choice: EncounterChoice): void {
    if (this.phase !== "encounter") return;
    const w = this.world;
    const g = w.guards.find((item) => item.id === guardId);
    this.input.reset();
    if (choice === "banish") {
      w.banish(guardId);
      this.phase = "play";
      this.phaseT = 0;
      return;
    }
    if (g) {
      g.mode = "patrol";
      knockBack(w.player, w.player.x >= g.x ? 1 : -1);
    }
    this.phase = "retreatOut";
    this.phaseT = 0;
  }
}
