import * as THREE from "three";
import { PROP_NAMES } from "../../data";
import { DESIGN_H, DESIGN_W, worldY } from "../../data/layout";
import { CrawlDirector, type FrameEvents } from "../../engine/crawlDirector";
import { createKeyInput, type KeyInput } from "../../engine/keyInput";
import type { CrawlCallbacks, EncounterChoice, MapDef } from "../../types";
import { GAIT } from "../actors/heroCalibration";
import { BakeCache } from "../bake/bakeCache";
import { SurfaceBaker } from "../bake/surfaceBaker";
import { HeroActor } from "../actors/heroActor";
import { LootGlints } from "../fx/lootGlint";
import { BurstFx } from "../fx/sparks";
import { LightRig } from "../lighting/lightRig";
import { createPostPipeline, type PostPipeline } from "../postfx/composer";
import { getZone } from "../zones";
import { ProgramKeeper } from "./programKeeper";
import { createRenderer } from "./renderer";
import { neighborsOf, prebakeNeighbors } from "./prebakeNeighbors";
import { loadRoom, type RoomLoadContext } from "./roomLoader";
import type { RoomScene } from "./roomScene";
import { createStageCamera, placeCamera, toScreen } from "./stageProjection";
import { warmOtherRooms } from "./warmCatalog";

/** 渲染分辨率上限(相对设计画布): 全屏 shader 层按设计画布 1:1 渲染, 高分屏不再加倍。 */
const MAX_PIXEL_RATIO = 1;

/**
 * 2.5D 房间探索运行时: 持有渲染器、场景、后处理与逻辑调度, 驱动每帧循环,
 * 通过回调把加载进度、调查提示、获得物、遭遇等事件交给 React。
 * 房间异步加载(并行编译 + 分帧烘焙), 加载期间停在黑幕, 不阻塞主线程;
 * 烘焙结果进缓存, 游玩中后台预烘焙相邻房间, 过门时只剩极短的加载。
 */
export class CrawlRuntime {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = createStageCamera();
  private post: PostPipeline;
  private baker: SurfaceBaker;
  private cache = new BakeCache();
  private keeper: ProgramKeeper;
  private lights = new LightRig();
  private input: KeyInput;
  private director: CrawlDirector;
  private hero: HeroActor;
  private burst = new BurstFx();
  private glints: LootGlints;
  private room: RoomScene | null = null;
  private pixelScale = { value: 1 };
  private accent = new THREE.Color();
  private raf = 0;
  private last = 0;
  private time = 0;
  private lootKey = 0;
  private prevPhase = "";
  /** 加载代次: 每次开始加载 +1, 旧的加载据此判定过期。 */
  private loadGen = 0;
  /** 其余房间的后台预编译; 完成后才开始预烘焙(预烘焙依赖常驻程序)。 */
  private warmed: Promise<void> | null = null;
  private booted = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, private cb: CrawlCallbacks, private map: MapDef) {
    this.renderer = createRenderer(canvas);
    this.baker = new SurfaceBaker(this.renderer);
    this.post = createPostPipeline(this.renderer, this.scene, this.camera);
    this.keeper = new ProgramKeeper(this.renderer, this.camera, this.scene, this.post.target);
    this.glints = new LootGlints(this.keeper.retire);
    this.input = createKeyInput();
    this.director = new CrawlDirector(this.input, GAIT, map.start);
    this.hero = new HeroActor(this.lights);
    this.scene.add(this.hero.group, this.burst.points, this.glints.group);
  }

  private get loadContext(): RoomLoadContext {
    return { keeper: this.keeper, baker: this.baker, cache: this.cache, lights: this.lights, burst: this.burst, pixelScale: this.pixelScale };
  }

  start(): void {
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
      this.last = now;
      // 首帧才开始加载: StrictMode 下首个实例在首帧前就被销毁, 不会白做一遍编译
      if (!this.booted) {
        this.booted = true;
        void this.boot();
      }
      if (this.room) this.frame(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /**
   * 启动: 常驻对象(主角、粒子、获得光效)的编译与首个房间的加载并行进行,
   * 就绪后后台预编译其余房间, 再开始预烘焙相邻房间。
   */
  private async boot(): Promise<void> {
    const glint = this.glints.warmMesh();
    const resident = this.keeper.compile([this.hero.group, this.burst.points, glint]).then(() => {
      glint.geometry.dispose();
      this.keeper.retire(glint.material as THREE.Material);
    });
    await this.enterRoom(resident);
    if (this.disposed) return;
    this.warmed = warmOtherRooms(this.keeper, this.map.rooms, this.director.world.room.id, () => this.disposed);
    this.prebake();
  }

  /** 加载导演当前所在的房间, 完成后上场并放行虹膜。ready 为上场前还需等待的其他准备。 */
  private async enterRoom(ready?: Promise<void>): Promise<void> {
    const gen = ++this.loadGen;
    const w = this.director.world;
    const name = w.room.name;
    const isStale = () => this.disposed || gen !== this.loadGen;
    this.cb.onLoading({ name, progress: 0 });
    const room = await loadRoom(this.loadContext, {
      room: w.room,
      searched: w.searched,
      guards: w.guards,
      isStale,
      onProgress: (progress) => {
        if (!isStale()) this.cb.onLoading({ name, progress });
      },
    });
    if (ready) await ready;
    if (!room || isStale()) {
      room?.dispose();
      return;
    }
    const zone = getZone(room.room.zone);
    const roomId = room.room.id;
    this.cache.touch(roomId, new Set([roomId, ...neighborsOf(roomId)]));
    this.room = room;
    this.scene.add(room.group);
    this.post.setStyle(zone.grade);
    this.accent.set(zone.accent);
    // 黑幕下先画一帧: 后处理程序的首次使用与贴图上传在这里完成, 不留到虹膜展开时
    this.post.setIris(0, DESIGN_W / 2, DESIGN_H / 2, this.accent);
    this.post.render(this.time);
    this.cb.onLoading(null);
    this.director.releaseLoad();
    if (this.warmed) this.prebake();
  }

  /** 预编译完成后, 在游玩阶段后台预烘焙当前房间的相邻房间; 下一次开始加载时中止。 */
  private prebake(): void {
    const gen = this.loadGen;
    const roomId = this.director.world.room.id;
    const isStale = () => this.disposed || gen !== this.loadGen;
    const canRun = () => this.director.phase === "play";
    void this.warmed?.then(() => {
      if (isStale()) return;
      return prebakeNeighbors({ keeper: this.keeper, baker: this.baker, cache: this.cache }, roomId, isStale, canRun);
    });
  }

  /** scale = 画布实际显示宽度 / 设计宽度 × 设备像素比。 */
  resize(scale: number): void {
    const pr = Math.min(MAX_PIXEL_RATIO, Math.max(0.5, scale));
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(DESIGN_W, DESIGN_H, false);
    this.post.setSize(DESIGN_W, DESIGN_H, pr);
    this.pixelScale.value = pr;
    this.burst.uniforms.uPixelScale.value = pr;
  }

  setBlocked(blocked: boolean): void {
    this.director.blocked = blocked;
    if (blocked) this.input.reset();
  }

  resolveEncounter(guardId: string, choice: EncounterChoice): void {
    const g = this.director.world.guards.find((item) => item.id === guardId);
    this.director.resolveEncounter(guardId, choice);
    if (g && choice === "banish") this.burst.spawn("shade", g.x, worldY(g.z, 130), 40, worldY(g.z));
  }

  private frame(dt: number): void {
    const room = this.room;
    if (!room) return;
    this.time += dt;
    const d = this.director;
    const ev = d.step(dt);
    if (ev.roomChanged) {
      this.leaveRoom(room);
      return;
    }
    const cam = d.camera;
    this.lights.update(this.time, cam.x);
    const w = d.world;
    room.syncGuards(w.guards, dt);
    this.syncProps(room);
    room.update(dt, cam.x, w.locked);
    this.hero.update(w.player, d.animator.pose, dt);
    this.handleEvents(ev, room);

    placeCamera(this.camera, cam.x, cam.shakeX, cam.shakeY);
    const p = w.player;
    const hs = toScreen(p.x, p.z, p.h + 120, cam.x);
    this.post.setIris(d.iris, hs.x, hs.y, this.accent);
    this.post.setImpact(d.impact);
    this.burst.update(dt);
    this.glints.update(dt);
    this.post.render(this.time);
  }

  /** 虹膜已收拢: 画一帧黑幕, 回收旧房间, 开始加载新房间(加载期间不再渲染)。 */
  private leaveRoom(room: RoomScene): void {
    this.post.setIris(0, DESIGN_W / 2, DESIGN_H / 2, this.accent);
    this.post.render(this.time);
    this.scene.remove(room.group);
    room.dispose();
    this.room = null;
    this.burst.clear();
    this.glints.clear();
    void this.enterRoom();
  }

  /** 交互物动画进度: 正在调查的按进度, 已搜索的停在终态, 其他归零(被打断时复位)。 */
  private syncProps(room: RoomScene): void {
    const w = this.director.world;
    for (const [id, view] of room.props) {
      if (w.searched.has(id)) continue;
      const progress = this.director.searchProgressOf(id);
      view.setAnim(progress ?? 0);
      view.setFocus(this.director.focus?.id === id);
    }
    const f = this.director.focus;
    if (f) {
      const view = room.props.get(f.id);
      const s = toScreen(f.x, f.z, view?.spec.promptH ?? 160, this.director.camera.x);
      this.cb.onPromptMove(s.x, s.y);
    }
  }

  private handleEvents(ev: FrameEvents, room: RoomScene): void {
    const d = this.director;
    if (ev.focusChanged) {
      const f = d.focus;
      this.cb.onPrompt(f ? { id: f.id, name: PROP_NAMES[f.kind] } : null);
    }
    if (ev.loot) {
      const prop = ev.loot;
      const view = room.props.get(prop.id);
      const top = view?.spec.promptH ?? 160;
      this.glints.spawn(prop.x, worldY(prop.z, top * 0.4), this.accent);
      const s = toScreen(prop.x, prop.z, top, d.camera.x);
      this.cb.onLoot({ key: ++this.lootKey, text: `获得：${prop.loot}`, x: s.x, y: s.y });
    }
    if (ev.searchDone) room.props.get(ev.searchDone.id)?.markSearched(false);
    if (ev.debugToggled) {
      this.hero.setDebug(d.debug);
      this.cb.onDebug(d.debug);
    }
    if (ev.landed) {
      const p = d.world.player;
      this.burst.spawn("dust", p.x, worldY(p.z, 4), 8, worldY(p.z));
    }
    if (d.phase === "encounter" && this.prevPhase !== "encounter") {
      this.hero.flash(1);
      const p = d.world.player;
      this.burst.spawn("shade", p.x, worldY(p.z, 120), 30, worldY(p.z));
    }
    this.prevPhase = d.phase;
    if (ev.encounter) this.cb.onEncounter(ev.encounter);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.input.dispose();
    this.room?.dispose();
    this.room = null;
    this.cache.dispose();
    this.hero.dispose();
    this.burst.dispose();
    this.glints.clear();
    this.post.dispose();
    // 不要 forceContextLoss: StrictMode 下同一块画布会被立即复用, 丢失的上下文会让新渲染器初始化失败。
    // 切换地图换 key 时画布本身会被替换, 旧上下文由浏览器回收。
    this.renderer.dispose();
  }
}
