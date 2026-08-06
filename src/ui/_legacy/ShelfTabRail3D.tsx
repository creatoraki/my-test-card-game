// 商店货架的「装备 / 材料」页签吊牌 —— WebGL(three.js)版。
//
// ★ 这两块牌读作**挂在货架立柱上、朝外张开的实体招牌**。原来的 CSS 版只能做单面贴片
//   (76×104 的玻璃砖 + clip-path 切角 + rotateY), 没有厚度也没有光照; 这里换成真几何体:
//   挤出的六棱台牌体 + 沿轮廓一圈霓虹灯管 + 加色辉光片, 选中的那块朝玩家开门式转出。
//
// ★ 交互**不走 WebGL**: canvas 只负责画, 上面盖着两颗透明的真 button(.sx-vtab-hit),
//   role/aria-selected/焦点环/键盘全部由 DOM 承担。因此不需要 Raycaster, 无障碍零回退,
//   牌子的屏幕位置也直接量这两颗按钮的布局盒 —— CSS 那套透视补偿(--sx-rail-in 等)
//   改了多少, 3D 这边自动跟上, 不存在第二处尺寸真相。
//
// ★ 相机与 .sx-stage 的 CSS 相机严格对齐(见 fitCamera): CSS 的 perspective +
//   perspective-origin: calc(100% - --sx-stage-right) 50% 等价于把相机架在那个消失点正前方
//   --panel-perspective 处。canvas 只是这幅 1920×1080 舞台里靠右的一小块, 所以用
//   setViewOffset 把它声明成整幅视口的子矩形 —— 消失点因此落在 canvas **外面**,
//   牌子才和面板贴在同一面墙上。
//   ⚠ --panel-tilt / --panel-perspective / --sx-stage-right 三个值都是每次布局**实读**
//     .sx-stage 的计算样式(见 measure), 这里不留副本 —— 改 CSS 不需要回来改 TS。
//
// ★ 降级: 系统「减少动态效果」或拿不到 WebGL 时, 原样渲染 CSS 版 ShelfTabRailCss ——
//   它就是改造前的实现, 样式仍在 ShopScene.css 里(.sx-vtab 一族), 不要删。

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Shape,
  SRGBColorSpace,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import type { ShopSlot } from "@/data/shop";
import { STAGE } from "@/ui/hooks/stage";
import "./ShelfTabRail3D.css";

// ===================== 页签定义 =====================
// ★ 类型与清单放在**控件这一侧**, ShopScene 从这里 import —— 加第三个品类只改这一处。
export type ShopTab = "equipment" | "material";

export const SHOP_TABS: { id: ShopTab; label: string }[] = [
  { id: "equipment", label: "装备" },
  { id: "material", label: "材料" },
];

interface ShopStock {
  equip: ShopSlot[];
  material: ShopSlot[];
}

interface Props {
  tab: ShopTab;
  onTab: (t: ShopTab) => void;
  shop: ShopStock;
  /** 返回据点的演出已开始: 整根柱子淡出, 与 .sx-root.is-leaving 的 420ms 对齐。 */
  leaving?: boolean;
}

// ===================== 几何 / 配色常数 =====================
// ⚠ 牌面尺寸必须与 ShopScene.css 的 .sx-vtab(width: 76px / --sx-vtab-h: 104px)一致 ——
//   这里只用于**建模**, 屏幕定位一律量 DOM(见 measure), 不靠这两个数推位置。
const TAB_W = 76;
const TAB_H = 104;
const NOTCH = 10; // 与 .sx-vtab 的 --notch 同值: 左上 / 右下各切一角
const DEPTH = 13; // 牌厚
const GLOW_PAD = 52; // 辉光片比牌面外扩多少(决定霓虹晕开的半径)

// CSS 相机的三个参数(--panel-perspective / --sx-stage-right / --panel-tilt)**不在这里写死** ——
// 每次布局都从 .sx-stage 的计算样式实读(见 measure)。ShopScene.css 改了倾角或透视量,
// 3D 这边自动跟上, 不会出现"面板转了牌子没转"这种两处真相不同步的错。下面只是读不到时的兜底。
const PERSPECTIVE_FALLBACK = 1600;
const STAGE_RIGHT_FALLBACK = 64;

// 姿态目标值。rotateY 为正 = 牌的**外**沿(左侧)朝玩家转出 —— 铰链在贴着面板的右沿上。
// ⚠ 两个值都是**相对静置角的增量**: 静置角 = 面板倾角(没被选中的牌就是墙上的一块板),
//   写成增量, 面板倾角改成多少都还是"再多转这么些"的读法。
const YAW_HOVER_DELTA = MathUtils.degToRad(7);
const YAW_ACTIVE_DELTA = MathUtils.degToRad(17);
const PUSH_HOVER = 2; // 对应 CSS 版的 translateX(2px)
const PUSH_ACTIVE = 5; // 对应 CSS 版的 translateX(5px)

// 霓虹亮度三档(灯管 / 牌面自发光共用这条曲线)
const LIT_IDLE = 0.26;
const LIT_HOVER = 0.62;
const LIT_ACTIVE = 1;

// 入场: 复刻 @keyframes sxRailIn 的时序(460ms, 第一块 420ms 延迟, 之后每块 +80ms)。
const IN_DUR = 460;
const IN_DELAY = 420;
const IN_STAGGER = 80;
const OUT_DUR = 420; // 与 sxFade 对齐

const NEON = new Color("#cf5aa8"); // --sx-glow
const NEON_HOT = new Color("#ffb3e2"); // --sx-glow-deep 再亮一档, 满亮时的管芯色
const INK_DIM = "#d1c1cc"; // --sx-ink-dim

const TEX_SCALE = 4; // 牌面贴图的超采样倍数
const DEBUG_SHELF_3D = import.meta.env.DEV;
const SHELF_3D_LOG = "[ShelfTabRail3D]";
const ENABLE_SHELF_3D = false;

function shelf3dLog(message: string, details?: unknown): void {
  if (!DEBUG_SHELF_3D) return;
  if (details === undefined) console.log(SHELF_3D_LOG, message);
  else console.log(SHELF_3D_LOG, message, details);
}

function shelf3dWarn(message: string, details?: unknown): void {
  if (!DEBUG_SHELF_3D) return;
  if (details === undefined) console.warn(SHELF_3D_LOG, message);
  else console.warn(SHELF_3D_LOG, message, details);
}

// ===================== 外壳: 决定走 3D 还是 CSS =====================
// ⚠ 判断放在外壳里 —— 内层组件的 hook 才不会变成条件调用(同 AmbienceLayer 的做法)。
export function ShelfTabRail(props: Props) {
  // context lost 之后由内层置起, 之后这一次挂载都走 CSS 版。
  const [failed, setFailed] = useState(false);
  const reduced = useMemo(prefersReducedMotion, []);
  const supported = useMemo(hasWebGL, []);
  const branch = ENABLE_SHELF_3D && !reduced && supported && !failed ? "3d" : "css";
  // ⚠ 必须是稳定引用: 它进了内层建场景那个 effect 的依赖表, 每次渲染换一个新函数
  //   会导致整套 WebGL 场景每帧重建。
  const fail = useCallback(() => setFailed(true), []);
  useEffect(() => {
    shelf3dLog("渲染分支判断", { branch, reduced, supported, failed });
  }, [branch, failed, reduced, supported]);
  if (branch === "css") return <ShelfTabRailCss {...props} />;
  return <ShelfTabRailGL {...props} onFail={fail} />;
}

export default ShelfTabRail;

// ===================== CSS 降级版(= 改造前的实现) =====================
// 样式在 ShopScene.css 的「页签吊牌」一节(.sx-tabrail / .sx-vtab / .sx-vtab-label)。
function ShelfTabRailCss({ tab, onTab }: Props) {
  return (
    <div className="sx-tabrail" role="tablist" aria-label="货架分类" aria-orientation="vertical">
      {SHOP_TABS.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            className={`sx-vtab${active ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTab(item.id)}
          >
            <span className="sx-vtab-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ===================== WebGL 版 =====================
// 注: shop 目前两版都没用上(牌面不再画数量徽标), 但它留在 Props 里 ——
// 想让招牌显示"还剩几件"时, 数据已经递到手边了。
function ShelfTabRailGL({ tab, onTab, leaving = false, onFail }: Props & { onFail: () => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const glRef = useRef<RailScene | null>(null);
  const [hover, setHover] = useState<ShopTab | null>(null);

  // 渲染循环每帧读的可变量走 ref: 悬停 / 选中 / 退场都不该重建场景。
  const stateRef = useRef({ tab, hover, leaving });
  stateRef.current = { tab, hover, leaving };

  useEffect(() => {
    shelf3dLog("ShelfTabRailGL 已挂载");
    return () => shelf3dLog("ShelfTabRailGL 即将卸载");
  }, []);

  // ---- 建场景。依赖为空: 只在挂载时跑一次。 ----
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const rail = railRef.current;
    if (!canvas || !rail) {
      shelf3dWarn("3D 初始化中止: canvas 或 rail ref 为空", { canvas: !!canvas, rail: !!rail });
      return;
    }
    const root = rail.closest<HTMLElement>(".sx-root");
    if (!root) {
      shelf3dWarn("3D 初始化中止: 找不到 .sx-root 容器");
      return;
    }

    let gl: RailScene;
    shelf3dLog("开始创建 WebGL 场景", {
      canvas: { width: canvas.clientWidth, height: canvas.clientHeight },
      root: { width: root.clientWidth, height: root.clientHeight },
    });
    try {
      gl = createRailScene(canvas);
      shelf3dLog("WebGL 场景创建成功");
    } catch (error) {
      console.error(`${SHELF_3D_LOG} WebGL 场景创建失败`, error);
      onFail(); // 建不出 renderer: 这一次挂载整个降级到 CSS 版
      return;
    }
    glRef.current = gl;
    gl.paint();

    const onLost = (e: Event) => {
      e.preventDefault();
      shelf3dWarn("收到 webglcontextlost, 将切换到 CSS 降级版", e);
      onFail();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    // 布局只在挂载 / 尺寸变化时量一次, 不逐帧读 DOM。
    let dirty = true;
    const ro = new ResizeObserver(() => (dirty = true));
    ro.observe(root);
    ro.observe(rail);

    const t0 = performance.now();
    let leftAt = 0; // 退场开始的时刻(0 = 还没开始)
    let raf = 0;
    let last = t0;
    let layoutSuccessLogged = false;
    let layoutFailureLogged = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); // 封顶 50ms: 切回标签页不让牌子瞬移
      last = now;

      if (dirty) {
        const box = measure(root, canvas, btnRefs.current);
        if (box) {
          gl.layout(box);
          dirty = false;
          if (!layoutSuccessLogged) {
            shelf3dLog("3D 布局测量成功", box);
            layoutSuccessLogged = true;
          }
        } else if (!layoutFailureLogged) {
          shelf3dWarn("3D 布局测量未完成", {
            canvas: canvas.getBoundingClientRect().toJSON(),
            root: root.getBoundingClientRect().toJSON(),
            buttons: btnRefs.current.map((button) => (button ? button.getBoundingClientRect().toJSON() : null)),
          });
          layoutFailureLogged = true;
        }
      }

      const s = stateRef.current;
      if (s.leaving && !leftAt) leftAt = now;
      const alpha = leftAt ? 1 - clamp01((now - leftAt) / OUT_DUR) : 1;

      gl.update({
        time: (now - t0) / 1000,
        dt,
        activeIndex: SHOP_TABS.findIndex((t) => t.id === s.tab),
        hoverIndex: SHOP_TABS.findIndex((t) => t.id === s.hover),
        enter: SHOP_TABS.map((_, i) => easeOut(clamp01((now - t0 - IN_DELAY - i * IN_STAGGER) / IN_DUR))),
        alpha,
      });
      gl.render();
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
      shelf3dLog("3D requestAnimationFrame 已启动");
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    // 后台标签页停帧(同 AmbienceLayer): 设施界面常被挂在后台, 不该白烧 GPU。
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      shelf3dLog("开始清理 3D 场景");
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      ro.disconnect();
      stop();
      glRef.current = null;
      // ⚠ 设施场景会反复进出, 漏掉 dispose 会撞上浏览器对 WebGL context 数量的上限。
      gl.dispose();
    };
  }, [onFail]);

  return (
    <div
      className="sx-tabrail is-3d"
      role="tablist"
      aria-label="货架分类"
      aria-orientation="vertical"
      ref={railRef}
    >
      {/* 只负责画。辉光要溢出布局盒, 所以 canvas 四周外扩(见 .sx-rail-gl)。 */}
      <canvas className="sx-rail-gl" ref={canvasRef} aria-hidden="true" />
      {SHOP_TABS.map((item, i) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            className="sx-vtab-hit"
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTab(item.id)}
            onPointerEnter={() => setHover(item.id)}
            onPointerLeave={() => setHover((cur) => (cur === item.id ? null : cur))}
            onFocus={() => setHover(item.id)}
            onBlur={() => setHover((cur) => (cur === item.id ? null : cur))}
          >
            {/* 牌面文字画在 WebGL 里, 这里留一份纯给读屏器与搜索用。 */}
            <span className="sx-vtab-sr">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ===================== 布局测量 =====================
// 舞台被 --stage-scale 等比缩放, getBoundingClientRect() 拿到的是屏幕 px;
// 这里一律先除回缩放系数, 换算成设计 px —— 3D 世界的单位**就是**设计 px。
interface RailBox {
  /** canvas 在舞台坐标里的位置与尺寸(设计 px) */
  canvas: { left: number; top: number; w: number; h: number };
  /** 每块牌的**铰链**(贴着面板那条右沿的中点), 舞台坐标 */
  hinges: { x: number; y: number }[];
  /** 立柱: 顶端 y 与长度 */
  post: { x: number; top: number; h: number };
  /** 当前舞台缩放, 用来定位图分辨率 */
  scale: number;
  /** 以下三项实读自 .sx-stage 的计算样式 —— CSS 那台相机的全部参数 */
  tilt: number; // --panel-tilt, 弧度
  perspective: number; // --panel-perspective, 设计 px
  stageRight: number; // --sx-stage-right, 设计 px
}

function measure(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  btns: (HTMLButtonElement | null)[],
): RailBox | null {
  const rootRect = root.getBoundingClientRect();
  const k = rootRect.width / STAGE.width;
  if (!(k > 0)) return null;
  const toDesign = (r: DOMRect) => ({
    left: (r.left - rootRect.left) / k,
    top: (r.top - rootRect.top) / k,
    w: r.width / k,
    h: r.height / k,
  });

  const c = toDesign(canvas.getBoundingClientRect());
  if (!(c.w > 0 && c.h > 0)) return null;

  const hinges: { x: number; y: number }[] = [];
  for (const b of btns) {
    if (!b) return null;
    const r = toDesign(b.getBoundingClientRect());
    hinges.push({ x: r.left + r.w, y: r.top + r.h / 2 }); // 右沿中点 = transform-origin: right center
  }
  if (!hinges.length) return null;

  // 立柱: 从第一块牌上方一点起, 垂到最后一块牌下方一截(CSS 版 ::before 的读法)。
  const first = hinges[0];
  const last = hinges[hinges.length - 1];
  const post = { x: first.x, top: first.y - TAB_H / 2 - 26, h: last.y - first.y + TAB_H + 120 };

  // CSS 那台相机的参数实读自 .sx-stage —— 不在 TS 里复制一份。
  const stage = root.querySelector<HTMLElement>(".sx-stage");
  const css = stage ? getComputedStyle(stage) : null;
  const tilt = MathUtils.degToRad(cssNumber(css, "--panel-tilt", 0));
  const perspective = cssNumber(css, "--panel-perspective", PERSPECTIVE_FALLBACK);
  const stageRight = cssNumber(css, "--sx-stage-right", STAGE_RIGHT_FALLBACK);

  return { canvas: c, hinges, post, scale: k, tilt, perspective, stageRight };
}

// 读一个自定义属性的数值部分。取不到或不是数(如 var 未定义)时用兜底值 ——
// ⚠ 角度只认 deg, 透视只认 px: ShopScene.css 里写的就是这两种单位, 换单位要顺手改这里。
function cssNumber(css: CSSStyleDeclaration | null, name: string, fallback: number): number {
  const raw = css?.getPropertyValue(name).trim();
  if (!raw) return fallback;
  const v = Number.parseFloat(raw);
  return Number.isFinite(v) ? v : fallback;
}

// ===================== three.js 场景 =====================
interface Plate {
  group: Group;
  /** 牌面(ExtrudeGeometry 的材质组 0) */
  face: MeshStandardMaterial;
  /** 挤出侧壁(材质组 1) */
  side: MeshStandardMaterial;
  frame: MeshBasicMaterial;
  glow: MeshBasicMaterial;
  scan: Mesh;
  scanMat: MeshBasicMaterial;
  base: CanvasTexture;
  emissive: CanvasTexture;
  /** 铰链在舞台坐标里的位置, 由 layout 写入 —— 每帧的姿态偏移都叠在它上面。 */
  hx: number;
  hy: number;
  /** 当前姿态(阻尼插值的状态量) */
  yaw: number;
  push: number;
  lit: number;
}

interface UpdateArgs {
  time: number;
  dt: number;
  activeIndex: number;
  hoverIndex: number;
  enter: number[];
  alpha: number;
}

interface RailScene {
  layout(box: RailBox): void;
  paint(): void;
  update(a: UpdateArgs): void;
  render(): void;
  dispose(): void;
}

function createRailScene(canvas: HTMLCanvasElement): RailScene {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  shelf3dLog("THREE.WebGLRenderer 创建成功", {
    drawingBuffer: { width: renderer.domElement.width, height: renderer.domElement.height },
    pixelRatio: renderer.getPixelRatio(),
  });
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera();

  // 灯: 一盏粉紫主光从面板方向(右前)打过来, 一盏冷色补光压住背面, 外加低强度环境光。
  // 立体感主要来自牌体倒角吃到的这两道高光 —— 没有主光就退回一块平贴片。
  scene.add(new AmbientLight(0x6a5a66, 1.1));
  const key = new PointLight(NEON, 900, 1600, 2);
  scene.add(key);
  const fill = new DirectionalLight(0x8fd6e8, 0.75);
  fill.position.set(-1, 0.4, 0.8);
  scene.add(fill);

  // ---- 共享几何 / 贴图 ----
  const bodyGeo = new ExtrudeGeometry(hexShape(TAB_W, TAB_H, NOTCH), {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 1.6,
    bevelSize: 1.6,
    bevelSegments: 2,
  });
  bodyGeo.translate(0, 0, -DEPTH / 2);
  // ExtrudeGeometry 的默认 UV 生成器直接用世界坐标(x, y)当 uv, 范围是 ±TAB_W/2 / ±TAB_H/2;
  // 这里靠 repeat/offset 把它归一化到 0..1, 免得自己写 UVGenerator。
  const uvFix = (t: CanvasTexture) => {
    t.repeat.set(1 / TAB_W, 1 / TAB_H);
    t.offset.set(0.5, 0.5);
  };

  const frameGeo = new ExtrudeGeometry(ringShape(), { depth: 3.4, bevelEnabled: false });
  frameGeo.translate(0, 0, DEPTH / 2 - 1);
  const glowGeo = new PlaneGeometry(TAB_W + GLOW_PAD * 2, TAB_H + GLOW_PAD * 2);
  const scanGeo = new PlaneGeometry(TAB_W - 8, 16);
  const glowTex = makeGlowTexture();
  const scanTex = makeScanTexture();

  const shared: (BufferGeometry | Material | CanvasTexture)[] = [bodyGeo, frameGeo, glowGeo, scanGeo, glowTex, scanTex];

  // ---- 每块牌 ----
  const plates: Plate[] = SHOP_TABS.map(() => {
    const group = new Group();

    const base = new CanvasTexture(document.createElement("canvas"));
    base.colorSpace = SRGBColorSpace;
    uvFix(base);
    const emissive = new CanvasTexture(document.createElement("canvas"));
    emissive.colorSpace = SRGBColorSpace;
    uvFix(emissive);

    // 牌面(正/背面)与挤出侧壁分属 ExtrudeGeometry 的两个材质组: 0 = 面, 1 = 侧壁。
    const faceMat = new MeshStandardMaterial({
      map: base,
      emissiveMap: emissive,
      emissive: new Color(0xffffff),
      emissiveIntensity: LIT_IDLE,
      metalness: 0.5,
      roughness: 0.44,
      transparent: true,
    });
    const sideMat = new MeshStandardMaterial({
      color: 0x1a1218,
      metalness: 0.85,
      roughness: 0.35,
      transparent: true,
    });
    const bodyMesh = new Mesh(bodyGeo, [faceMat, sideMat]);
    bodyMesh.position.x = -TAB_W / 2; // 铰链在右沿 ⇒ 整块牌相对枢轴左移半个身位
    group.add(bodyMesh);

    // 霓虹灯管: 沿轮廓一圈的细环, 不吃光照(toneMapped:false + Basic), 亮度靠 color 缩放。
    const frameMat = new MeshBasicMaterial({ color: NEON.clone(), transparent: true, toneMapped: false });
    const frameMesh = new Mesh(frameGeo, frameMat);
    frameMesh.position.x = -TAB_W / 2;
    group.add(frameMesh);

    // 加色辉光片: 代替后期 bloom(引 UnrealBloomPass 要再拖进一整套 postprocessing)。
    const glowMat = new MeshBasicMaterial({
      map: glowTex,
      color: NEON.clone(),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const glowMesh = new Mesh(glowGeo, glowMat);
    glowMesh.position.set(-TAB_W / 2, 0, DEPTH / 2 + 5);
    glowMesh.renderOrder = 2;
    group.add(glowMesh);

    // 扫描线: 只在选中的牌上从上往下走一趟。
    const scanMat = new MeshBasicMaterial({
      map: scanTex,
      color: NEON_HOT.clone(),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      opacity: 0,
    });
    const scanMesh = new Mesh(scanGeo, scanMat);
    scanMesh.position.set(-TAB_W / 2, 0, DEPTH / 2 + 2.5);
    scanMesh.renderOrder = 3;
    group.add(scanMesh);

    scene.add(group);
    return {
      group,
      face: faceMat,
      side: sideMat,
      frame: frameMat,
      glow: glowMat,
      scan: scanMesh,
      scanMat,
      base,
      emissive,
      hx: 0,
      hy: 0,
      yaw: 0,
      push: 0,
      lit: LIT_IDLE,
    };
  });

  // ---- 立柱(替代 CSS 版的 .sx-tabrail::before) ----
  const postGeo = new BoxGeometry(2.4, 1, 2.4);
  const postMat = new MeshBasicMaterial({ color: NEON.clone(), transparent: true, opacity: 0.7, toneMapped: false });
  const post = new Mesh(postGeo, postMat);
  scene.add(post);
  shared.push(postGeo, postMat);

  let alpha = 1;
  // 还没量到布局之前不画: 牌子的位置全部来自 DOM 测量, 提前渲染会在世界原点闪一帧。
  let laid = false;
  // 静置角 = 面板倾角, 实读自 CSS(见 measure)。悬停/选中角都是在它基础上再多转一些。
  let yawIdle = 0;
  let firstRenderLogged = false;
  let renderBeforeLayoutLogged = false;

  return {
    layout(box) {
      laid = true;
      yawIdle = box.tilt;
      renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * box.scale, 2));
      renderer.setSize(box.canvas.w, box.canvas.h, false); // false: CSS 尺寸由样式表说了算

      fitCamera(camera, box);

      // 世界坐标 = 舞台设计坐标, 但 y 向上(舞台的 y 向下), 故一律取负。
      // 铰链存进 plate: update 每帧的推出/入场位移都叠在这个基准上。
      plates.forEach((p, i) => {
        const h = box.hinges[i];
        p.hx = h.x;
        p.hy = -h.y;
      });
      post.position.set(box.post.x, -(box.post.top + box.post.h / 2), -DEPTH / 2);
      post.scale.y = box.post.h;
      // 主光挂在牌列右前方(面板那一侧), 跟着布局走。
      const mid = box.hinges[Math.floor(box.hinges.length / 2)];
      key.position.set(mid.x + 120, -mid.y + 90, 260);
    },

    paint() {
      plates.forEach((p, i) => {
        drawPlate(p.base.image as HTMLCanvasElement, SHOP_TABS[i].label, false);
        drawPlate(p.emissive.image as HTMLCanvasElement, SHOP_TABS[i].label, true);
        p.base.needsUpdate = true;
        p.emissive.needsUpdate = true;
      });
    },

    update({ time, dt, activeIndex, hoverIndex, enter, alpha: a }) {
      alpha = a;
      plates.forEach((p, i) => {
        const active = i === activeIndex;
        const hovered = i === hoverIndex;

        // 目标姿态。⚠ 三档是互斥的读法: 选中 > 悬停 > 静置。
        const yawTarget = yawIdle + (active ? YAW_ACTIVE_DELTA : hovered ? YAW_HOVER_DELTA : 0);
        const pushTarget = active ? PUSH_ACTIVE : hovered ? PUSH_HOVER : 0;
        const litTarget = active ? LIT_ACTIVE : hovered ? LIT_HOVER : LIT_IDLE;

        // 阻尼插值而不是线性 lerp: 与帧率无关, 且切换时天然是 CSS 那条 ease-out 的手感。
        p.yaw = MathUtils.damp(p.yaw, yawTarget, 9, dt);
        p.push = MathUtils.damp(p.push, pushTarget, 11, dt);
        p.lit = MathUtils.damp(p.lit, litTarget, 8, dt);

        // 待机呼吸: 极缓慢的摆动, 各牌错相位, 免得两块牌像连体一样一起晃。
        const breath = Math.sin(time * 0.55 + i * 1.7) * MathUtils.degToRad(1.4);
        // 霓虹管的低频抖动 —— 真灯管的手感来自这一点点不稳定。
        const flicker = 0.93 + 0.07 * Math.sin(time * 7.3 + i * 2.1) * Math.sin(time * 1.9 + i);

        // 入场进度 t: 0 → 1。位移对应 @keyframes sxRailIn 的 translateX(-26px)。
        const t = enter[i] ?? 1;
        p.group.rotation.y = p.yaw + breath;
        p.group.position.set(p.hx + p.push - (1 - t) * 26, p.hy, p.push * 1.6 + (active ? 6 : 0));

        // 一份亮度推所有发光通道: 牌面自发光、灯管色、辉光片浓度。
        const lit = p.lit * flicker * t;
        const fade = alpha * t; // 入场 × 退场, 所有材质共用
        p.face.emissiveIntensity = lit;
        p.frame.color.copy(NEON).lerp(NEON_HOT, clamp01(lit)).multiplyScalar(0.45 + lit * 0.55);
        p.glow.color.copy(NEON).lerp(NEON_HOT, clamp01(lit * 0.7));
        p.glow.opacity = (0.16 + lit * 0.5) * fade;
        p.frame.opacity = fade;
        p.face.opacity = fade;
        p.side.opacity = fade;

        // 扫描线: 只在选中的牌上跑, 1.6s 一趟, 从牌顶走到牌底。
        if (active) {
          const phase = (time % 1.6) / 1.6;
          p.scan.position.y = TAB_H / 2 - phase * TAB_H;
          p.scanMat.opacity = Math.sin(phase * Math.PI) * 0.55 * fade;
        } else {
          p.scanMat.opacity = 0;
        }
      });

      postMat.opacity = 0.7 * alpha * (enter[0] ?? 1);
    },

    render() {
      if (!laid) {
        if (!renderBeforeLayoutLogged) {
          shelf3dWarn("跳过 renderer.render: 尚未完成 3D 布局");
          renderBeforeLayoutLogged = true;
        }
        return;
      }
      if (!firstRenderLogged) {
        shelf3dLog("首次调用 renderer.render");
        firstRenderLogged = true;
      }
      renderer.render(scene, camera);
    },

    dispose() {
      shelf3dLog("释放 WebGLRenderer", { forceContextLoss: import.meta.env.PROD });
      plates.forEach((p) => {
        p.base.dispose();
        p.emissive.dispose();
        p.face.dispose();
        p.side.dispose();
        p.frame.dispose();
        p.glow.dispose();
        p.scanMat.dispose();
      });
      shared.forEach((r) => r.dispose());
      renderer.dispose();
      if (import.meta.env.PROD) {
        renderer.forceContextLoss();
      } else {
        shelf3dLog("开发模式跳过 forceContextLoss，避免 StrictMode 重复挂载复用失效 Context");
      }
    },
  };
}

// 把 canvas 声明成整幅 1920×1080 舞台的一块子矩形, 使消失点落在 canvas 之外 ——
// 这是 3D 牌子与 CSS 面板"贴在同一面墙上"的全部依据。
//
// CSS 的 perspective-origin 在舞台坐标 (1920 - --sx-stage-right, 540); 相机就架在它正前方
// --panel-perspective 处。PerspectiveCamera 的视锥关于自身光轴对称, 所以先取一个**以消失点为
// 中心**、能罩住整幅舞台的对称视口(fullW × fullH), 再用 setViewOffset 从里面裁出 canvas 那一块。
// 取 fullW = 2 × originX 后, 这个对称视口的左上角正好落在舞台原点 ⇒ offset 直接就是 canvas
// 的舞台坐标, 不用再换算。
function fitCamera(camera: PerspectiveCamera, box: RailBox): void {
  const d = box.perspective;
  const originX = STAGE.width - box.stageRight;
  const originY = STAGE.height / 2;
  const fullW = originX * 2;
  const fullH = originY * 2;

  camera.fov = MathUtils.radToDeg(2 * Math.atan(fullH / 2 / d));
  camera.aspect = fullW / fullH;
  camera.near = 1;
  camera.far = d * 3;
  camera.position.set(originX, -originY, d);
  camera.lookAt(originX, -originY, 0);
  // 每次都要重设: setViewOffset 记的是像素矩形, canvas 一变尺寸就必须重算。
  camera.setViewOffset(fullW, fullH, box.canvas.left, box.canvas.top, box.canvas.w, box.canvas.h);
  camera.updateProjectionMatrix();
}

// ===================== 形状与贴图 =====================
// 与 .sx-vtab 的 clip-path 同形: 左上、右下各切一角。y 轴向上, 故 CSS 的"顶边"= +h/2。
function hexShape(w: number, h: number, notch: number): Shape {
  const x = w / 2;
  const y = h / 2;
  const s = new Shape();
  s.moveTo(-x + notch, y);
  s.lineTo(x, y);
  s.lineTo(x, -y + notch);
  s.lineTo(x - notch, -y);
  s.lineTo(-x, -y);
  s.lineTo(-x, y - notch);
  s.closePath();
  return s;
}

// 灯管: 外轮廓内缩 3px, 挖掉再内缩 3.4px 的洞 ⇒ 一圈约 3.4px 宽的环。
function ringShape(): Shape {
  const outer = hexShape(TAB_W - 6, TAB_H - 6, NOTCH);
  const inner = hexShape(TAB_W - 12.8, TAB_H - 12.8, NOTCH);
  outer.holes.push(inner);
  return outer;
}

// 辉光片贴图: 把灯管轮廓用 shadowBlur 反复描几遍, 得到一张软边光晕。
// 画的是白色, 具体颜色交给材质的 color 去乘 —— 一张贴图两块牌共用。
function makeGlowTexture(): CanvasTexture {
  const w = TAB_W + GLOW_PAD * 2;
  const h = TAB_H + GLOW_PAD * 2;
  const c = document.createElement("canvas");
  c.width = Math.round(w * 2);
  c.height = Math.round(h * 2);
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.scale(2, 2);
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    // 三档模糊叠加: 近处的实、远处的散, 合起来才像灯管而不是一圈均匀描边。
    for (const [blur, width, a] of [
      [34, 3, 0.5],
      [16, 2.4, 0.6],
      [5, 1.6, 0.9],
    ] as const) {
      ctx.shadowBlur = blur;
      ctx.lineWidth = width;
      ctx.globalAlpha = a;
      strokeHex(ctx, TAB_W - 9, TAB_H - 9, NOTCH);
    }
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// 扫描线: 一条上下渐隐的横带。
function makeScanTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, "#00000000");
    g.addColorStop(0.5, "#ffffffff");
    g.addColorStop(1, "#00000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 64);
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// 2D 上下文里画一遍六边形轮廓(y 向下, 与 canvas 一致 —— 上下对称, 切角位置无所谓)。
function strokeHex(ctx: CanvasRenderingContext2D, w: number, h: number, notch: number): void {
  const x = w / 2;
  const y = h / 2;
  ctx.beginPath();
  ctx.moveTo(-x + notch, -y);
  ctx.lineTo(x, -y);
  ctx.lineTo(x, y - notch);
  ctx.lineTo(x - notch, y);
  ctx.lineTo(-x, y);
  ctx.lineTo(-x, -y + notch);
  ctx.closePath();
  ctx.stroke();
}

// 牌面。同一份构图画两遍:
//   glow=false → 漫反射贴图(暗金属底 + 暗刻字), 灯灭时也认得出是哪一块;
//   glow=true  → 自发光贴图(纯黑底 + 发光的字与徽标), 亮度由 emissiveIntensity 统一推。
// ⚠ canvas 2D 没有 writing-mode: 竖排靠逐字 fillText 手动叠, 字距沿用 CSS 版的 6px 观感。
function drawPlate(c: HTMLCanvasElement, label: string, glow: boolean): void {
  const S = TEX_SCALE;
  c.width = TAB_W * S;
  c.height = TAB_H * S;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.scale(S, S);

  if (glow) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, TAB_W, TAB_H);
  } else {
    // 暗金属底: 与 .sx-vtab 的 linear-gradient(150deg, ...) 同族配方
    const g = ctx.createLinearGradient(0, 0, TAB_W, TAB_H);
    g.addColorStop(0, "#241722");
    g.addColorStop(0.58, "#170f15");
    g.addColorStop(1, "#0c0709");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TAB_W, TAB_H);
    // 细横纹: 给金属一点各向异性, 免得大面积纯色显得像塑料
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#ffffff";
    for (let y = 3; y < TAB_H; y += 4) ctx.fillRect(0, y, TAB_W, 1);
    ctx.globalAlpha = 1;
  }

  const ink = glow ? "#ffffff" : INK_DIM;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (glow) {
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 10;
  }

  // 竖排品类名: 两个汉字上下叠, 整体居中。
  const chars = [...label];
  const size = 19;
  const step = size + 6;
  const cy = TAB_H / 2;
  ctx.fillStyle = ink;
  ctx.font = `600 ${size}px "Bebas Neue", "Noto Sans SC", sans-serif`;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, TAB_W / 2, cy + (i - (chars.length - 1) / 2) * step);
  });
}

// ===================== 小工具 =====================
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
// 近似 cubic-bezier(0.2, 0.72, 0.28, 1) —— CSS 版入场用的那条缓动。
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function prefersReducedMotion(): boolean {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  shelf3dLog("减少动态效果检测", { reduced });
  return reduced;
}

let webglOk: boolean | null = null;
function hasWebGL(): boolean {
  if (webglOk !== null) {
    shelf3dLog("WebGL 能力检测使用缓存", { supported: webglOk });
    return webglOk;
  }
  try {
    const c = document.createElement("canvas");
    const hasWebGLApi = typeof window !== "undefined" && !!window.WebGLRenderingContext;
    const webgl2 = hasWebGLApi && !!c.getContext("webgl2");
    const webgl = hasWebGLApi && !!c.getContext("webgl");
    webglOk = webgl2 || webgl;
    shelf3dLog("WebGL 能力检测完成", { hasWebGLApi, webgl2, webgl, supported: webglOk });
  } catch {
    webglOk = false;
    shelf3dWarn("WebGL 能力检测抛出异常", { supported: webglOk });
  }
  return webglOk;
}
