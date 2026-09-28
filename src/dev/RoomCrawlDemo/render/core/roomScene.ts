import * as THREE from "three";
import type { GuardState } from "../../engine/guardBrain";
import type { RoomDef } from "../../types";
import { GuardActor } from "../actors/guardActor";
import type { BakeCache } from "../bake/bakeCache";
import type { BakeJob, FrameBudget, SurfaceBaker } from "../bake/surfaceBaker";
import { buildRoomFx, type RoomFx } from "../fx/roomFx";
import type { BurstFx } from "../fx/sparks";
import type { LightRig } from "../lighting/lightRig";
import { buildDecor, buildHangingLamp } from "../props/decorProps";
import { PortalDoor } from "../props/portalDoor";
import { PropView } from "../props/propFactory";
import { buildRoomLayers, type RoomLayers } from "../room/buildRoom";
import type { ZoneShaders } from "../zones";
import { Disposer, type RetireMaterial } from "./disposer";

/** 悬挂灯的判定: 离后墙足够远的灯画成吊灯。 */
const HANGING_Z = 40;

export interface RoomSceneOptions {
  room: RoomDef;
  zone: ZoneShaders;
  lights: LightRig;
  burst: BurstFx;
  pixelScale: THREE.IUniform<number>;
  searched: ReadonlySet<string>;
  /** 材质回收方式(ProgramKeeper.retire)。 */
  retire: RetireMaterial;
}

/**
 * 一个房间的全部可见内容: 五层场景、交互物、装饰、吊灯、传送门、守卫、环境特效。
 * 构造时只建网格与材质(不碰 GPU); 后墙、地面与静态装饰的烘焙由 bake() 分帧执行。
 * 换房间时整体回收重建; 烘焙贴图归烘焙缓存, 不随房间释放。
 */
export class RoomScene {
  readonly group = new THREE.Group();
  readonly room: RoomDef;
  readonly zone: ZoneShaders;
  readonly layers: RoomLayers;
  readonly props = new Map<string, PropView>();
  /** 待执行的烘焙工作; 其面片需要与场景一起预编译。 */
  readonly bakeJobs: BakeJob[] = [];
  private lights: LightRig;
  private doors: PortalDoor[] = [];
  private guards = new Map<string, GuardActor>();
  private fx: RoomFx;
  private statics = new THREE.Group();
  private disposer: Disposer;
  private disposed = false;

  constructor(opts: RoomSceneOptions) {
    const { room, zone, lights, burst, pixelScale, searched } = opts;
    this.room = room;
    this.zone = zone;
    this.lights = lights;
    this.disposer = new Disposer(opts.retire);
    lights.setRoom(room.lights, zone.ambient);
    this.layers = buildRoomLayers(room, zone, lights.uniforms);
    this.bakeJobs.push(...this.layers.bakeJobs);
    this.statics.add(this.layers.group);
    room.decor.forEach((def, i) => {
      const decor = buildDecor(def, i, lights);
      this.statics.add(decor.mesh);
      this.bakeJobs.push(decor.job);
    });
    room.lights.forEach((light, i) => {
      if (light.z > HANGING_Z) this.statics.add(buildHangingLamp(light, i, lights));
    });
    for (const def of room.props) {
      const view = new PropView(def, lights, zone.accent, { fx: burst, lights });
      if (searched.has(def.id)) view.markSearched(true);
      this.props.set(def.id, view);
      this.group.add(view.group);
    }
    for (const door of room.doors) {
      const portal = new PortalDoor(door, room, lights, zone.accent);
      this.doors.push(portal);
      this.group.add(portal.mesh);
    }
    this.fx = buildRoomFx(room, zone, lights.uniforms, burst, pixelScale);
    this.statics.add(this.fx.group);
    this.group.add(this.statics);
  }

  /** 需要预编译的全部对象: 场景树 + 烘焙面片。 */
  compileTargets(): THREE.Object3D[] {
    return [this.group, ...this.bakeJobs.map((job) => job.mesh)];
  }

  /** 缓存里还没有结果、需要真正烘焙的工作。 */
  pendingJobs(cache: BakeCache): BakeJob[] {
    return this.bakeJobs.filter((job) => !cache.get(this.room.id, job.key));
  }

  /** 按给定块宽, 需要真正烘焙的总块数(进度统计用)。 */
  bakeTiles(baker: SurfaceBaker, cache: BakeCache, tileW: number): number {
    return this.pendingJobs(cache).reduce((sum, job) => sum + baker.tilesOf(job, tileW), 0);
  }

  /**
   * 按预算分帧执行全部烘焙: 缓存命中的直接回填, 其余烘完交给缓存再回填。
   * 房间被回收或 isStale 为真时中途放弃。返回是否全部完成。
   */
  async bake(baker: SurfaceBaker, cache: BakeCache, budget: FrameBudget, isStale: () => boolean, onTile?: () => void): Promise<boolean> {
    const stale = () => this.disposed || isStale();
    const roomId = this.room.id;
    while (this.bakeJobs.length > 0) {
      const job = this.bakeJobs[0];
      let baked = cache.get(roomId, job.key);
      if (!baked) {
        const fresh = await baker.bakeAsync(job, budget, stale, onTile);
        if (!fresh) return false;
        baked = cache.adopt(roomId, job.key, fresh);
      }
      job.apply(baked);
      this.bakeJobs.shift();
      this.disposer.disposeMesh(job.mesh);
    }
    return true;
  }

  /** 守卫渲染体与逻辑状态对齐: 新出现的建起来, 消失的回收。 */
  syncGuards(states: readonly GuardState[], dt: number): void {
    const alive = new Set<string>();
    states.forEach((g, i) => {
      alive.add(g.id);
      let actor = this.guards.get(g.id);
      if (!actor) {
        actor = new GuardActor(g.id, this.lights.uniforms, i * 3.7 + 1.3);
        this.guards.set(g.id, actor);
        this.group.add(actor.group);
      }
      actor.update(g, dt);
    });
    for (const [id, actor] of this.guards) {
      if (alive.has(id)) continue;
      this.group.remove(actor.group);
      this.disposer.disposeObjects(actor.group);
      this.guards.delete(id);
    }
  }

  update(dt: number, camX: number, locked: boolean): void {
    this.layers.follow(camX);
    this.layers.uniforms.uLocked.value += ((locked ? 1 : 0) - this.layers.uniforms.uLocked.value) * Math.min(1, dt * 5);
    for (const door of this.doors) door.update(locked, dt);
    for (const view of this.props.values()) view.update(dt);
    this.fx.update(dt);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const view of this.props.values()) view.release();
    for (const door of this.doors) door.release(this.lights);
    for (const job of this.bakeJobs) this.disposer.disposeMesh(job.mesh);
    this.bakeJobs.length = 0;
    this.disposer.disposeTree(this.group);
  }
}
