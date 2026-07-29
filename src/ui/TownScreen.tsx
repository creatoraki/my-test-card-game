// 据点(大厅) —— 远征之间的常驻中枢, 现在是一张沉浸式场景页: 大厅背景图 + 右侧一块 bento 玻璃面板。
//
// 与主菜单同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/stage.ts):
// ★ 本文件里所有坐标/尺寸都是「设计 px」(1920×1080 基准), 直接照着 1920×1080 的设计稿填数就行,
//   任何分辨率下构图逐 px 一致, 画布之外露出的是黑边。
// ⚠ 不要在画布内写 vw/vh 或按窗口宽度的 @media —— 那会让构图重新随分辨率漂移。
//
// ★ 入口布局 = 右侧 718×350 的 **bento 马赛克**: 6 块尺寸各不相同的半透明毛玻璃砖, 靠 10px 缝隙
//   拼出一个外轮廓规则的矩形。冬眠仓 / 训练室(真入口)占最大的两块, 未开放设施是小块 ——
//   可用性靠面积表达, 不必额外加说明。马赛克本身由下面内联 style 的 gridTemplateAreas 定义。
//   ⚠ 控制终端已开放但仍占小块(worklog), 与「面积=可用性」的约定暂时不符, 想强调它就调
//     gridTemplateAreas 里 worklog 占的格数。
//
// ★ 点击冬眠仓 / 训练室 / 控制终端会播一段「进设施」演出(见下方 enterFacility 与 ui/facilityScenes.ts):
//   镜头推向该设施在大厅里的位置并放大 → 界面元素逐个错峰飞出 → 大厅背景淡出、设施背景淡入。
//
// ★ 设施内容登记在下面的 FACILITY_CONTENT: 目前有**控制终端**(ui/ControlTerminalScene.tsx ——
//   下降舱出击 + 委托占位)与**冬眠仓**(ui/CryoScene.tsx —— 编队 / 只读属性 / 唤醒队员);
//   训练室仍只有背景 +「返回据点」, 功能未做。
//
// ⚠ 「回主菜单」仍然没有入口(角落只剩「重置存档」), 但据点**已不再是死路** ——
//   控制终端 → 下降舱 → 确认下降 会接上 runStore.startExpedition 进探索牌局;
//   编队已经在冬眠仓里了。

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useTownStore } from "../store/townStore";
import { useStageScale } from "./stage";
import { prefersReducedMotion } from "./transitions";
import {
  ENTER_TOTAL,
  FACILITY_CINEMA,
  FACILITY_SCENES,
  FLY_PICKED,
  FLY_RESET,
  FLY_STATUS,
  FLY_TILES,
  PICK_FLASH,
  facilityCamera,
  flyBackDelay,
  hasFacilityScene,
  warmFacilityBg,
  type FlyOut,
} from "./facilityScenes";
import { ControlTerminalScene } from "./ControlTerminalScene";
import { CryoScene } from "./CryoScene";
import townBg from "../assets/场景/大厅.png";
import "./TownScreen.css";

// ===================== 设施图标 =====================
// 全部是线框风内联 SVG —— 刻意不用 emoji: emoji 在 Windows 上会渲染成彩色贴纸, 和暗色科技风冲突。
// 颜色由父级 .bento-icon 的 color 决定(stroke="currentColor"), 故 hover 变色/发光只改一处。
// 画法统一: 48×48 视框, 外轮廓 strokeWidth 1.2 + opacity .38 当陪衬, 主体 strokeWidth 1.6。

// 冬眠仓(设定里的「低温维生区」): 六角雪花。
const CRYO_ARM = "M24 24V7M24 12.5l-4.5-4.5M24 12.5l4.5-4.5M24 18l-3.5-3.5M24 18l3.5-3.5";

function CryoIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      {/* 外圈六边形: 维生舱的轮廓, 压低透明度当陪衬 */}
      <path
        d="M24 3 5.8 13.5v21L24 45l18.2-10.5v-21L24 3Z"
        strokeWidth={1.2}
        strokeLinejoin="round"
        opacity={0.38}
      />
      {/* 六根雪花臂: 同一段路径旋转 6 次(每 60°), 绕画心 24,24 */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <path key={deg} d={CRYO_ARM} strokeWidth={1.6} transform={`rotate(${deg} 24 24)`} />
      ))}
    </svg>
  );
}

// 训练室(设定里的「作业模拟间」): 同心靶环 + 十字准星。
function TrainingIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="24" cy="24" r="17" strokeWidth={1.2} opacity={0.38} />
      <circle cx="24" cy="24" r="10.5" strokeWidth={1.6} />
      <circle cx="24" cy="24" r="3.4" strokeWidth={1.6} />
      {/* 四向准星刻线: 穿过外圈, 读作「瞄准中」 */}
      <path d="M24 2.5v8M24 37.5v8M2.5 24h8M37.5 24h8" strokeWidth={1.6} />
    </svg>
  );
}

// 模块装配舱: 套嵌的六角螺母 —— 读作「可拆装的模块」。
function AssemblyIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path
        d="M24 6 39.6 15v18L24 42 8.4 33V15L24 6Z"
        strokeWidth={1.2}
        strokeLinejoin="round"
        opacity={0.38}
      />
      <path
        d="M24 13 33 18.5v11L24 35l-9-5.5v-11L24 13Z"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="3" strokeWidth={1.6} />
    </svg>
  );
}

// 控制终端: 立式终端屏 + 三条长短不一的工单列表行。
function WorkOrderIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <rect x="7" y="9" width="34" height="26" rx="2" strokeWidth={1.2} opacity={0.38} />
      {/* 长短错落的三行 = 一张待办工单, 比等长三行更像「列表」 */}
      <path d="M14 17h13M14 22h20M14 27h9" strokeWidth={1.6} />
      <path d="M19 35v5M29 35v5M15 41h18" strokeWidth={1.4} />
    </svg>
  );
}

// 生物维护舱: 横置维生胶囊 + 医疗十字, 两端各一截管线接口。
function MedicalIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <rect x="6" y="14" width="36" height="20" rx="10" strokeWidth={1.2} opacity={0.38} />
      <path d="M24 18v12M18 24h12" strokeWidth={1.8} />
      <path d="M2.5 24h3.5M42 24h3.5" strokeWidth={1.4} />
    </svg>
  );
}

// 物资中转仓: 2×2 货格, 左下一格已被占用 —— 读作「库存」而不是空网格。
function StorageIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <rect x="8" y="8" width="32" height="32" strokeWidth={1.2} opacity={0.38} />
      <path d="M24 8v32M8 24h32" strokeWidth={1.4} />
      <rect x="11" y="27" width="10" height="10" strokeWidth={1.6} />
    </svg>
  );
}

interface Facility {
  id: string; // 同时就是 grid-area 名, 与下面 gridTemplateAreas 里的词一一对应
  name: string;
  desc: string;
  icon: ReactNode;
  size: "lg" | "md" | "sm"; // 只影响图标/字号/斜切角尺度, 砖块几何由 grid 决定
  locked?: boolean; // 未开放占位: 降亮 + 右上角挂「未开放」小标 + hover 反馈弱一档
}

// 六个设施。名称与功能一律照抄 游戏设定.md 第四节「据点设施」表:
// 低温维生区 → 冬眠仓 / 作业模拟间 → 训练室, 其余四个直接用设定里的原名。
const FACILITIES: Facility[] = [
  { id: "cryo", name: "冬眠仓", desc: "唤醒队友 · 编成小队。", icon: <CryoIcon />, size: "md" },
  {
    id: "assembly",
    name: "模块装配舱",
    desc: "装备打造与强化。",
    icon: <AssemblyIcon />,
    size: "sm",
    locked: true,
  },
  {
    id: "worklog",
    name: "控制终端",
    desc: "接取任务、选择地下城。",
    icon: <WorkOrderIcon />,
    size: "sm",
  },
  {
    id: "medical",
    name: "生物维护舱",
    desc: "治疗与污染处理。",
    icon: <MedicalIcon />,
    size: "md",
    locked: true,
  },
  {
    id: "training",
    name: "训练室",
    desc: "配队 · 加点 · 卡组调整。",
    icon: <TrainingIcon />,
    size: "lg",
  },
  {
    id: "storage",
    name: "物资中转仓",
    desc: "背包与库存管理。",
    icon: <StorageIcon />,
    size: "sm",
    locked: true,
  },
];

// ===================== 设施内容登记处 =====================
// 设施 id → 进去之后在设施背景上渲染什么。未登记的设施仍是「只有背景 + 返回据点」的空场景。
// ★ 实现一个新设施 = 写一个 ui/<XxxScene>.tsx + 在这里加一行, 本组件其余部分一行都不用动。
// leaving 参数 = 返回据点的演出已开始, 交给设施组件自己做淡出(与背景交叉淡同步)。
const FACILITY_CONTENT: Record<string, (leaving: boolean) => ReactNode> = {
  worklog: (leaving) => <ControlTerminalScene leaving={leaving} />,
  cryo: (leaving) => <CryoScene leaving={leaving} />,
};

// ===================== 进设施演出 =====================
// 阶段机: idle(可交互) → entering(运镜+飞出+交叉淡) → inside(设施场景) → leaving(反向) → idle。
// 演出期间(entering/leaving)画布整体不接受点击, 防连点打断时序。
type Phase = "idle" | "entering" | "inside" | "leaving";

// 把一组飞出参数下发成 CSS 变量。位移写设计 px —— 画布整体缩放, 故与分辨率无关。
function flyVars(fly: FlyOut, delay = fly.delay, ms = fly.ms): CSSProperties {
  return {
    "--fly-x": `${fly.dx}px`,
    "--fly-y": `${fly.dy}px`,
    "--fly-rot": `${fly.rot}deg`,
    "--fly-ms": `${ms}ms`,
    "--fly-delay": `${delay}ms`,
  } as CSSProperties;
}

export function TownScreen() {
  const resetProfile = useTownStore((s) => s.resetProfile);
  const terminalCredits = useTownStore((s) => s.loot);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeFacilities = FACILITIES.filter((facility) => !facility.locked).length;
  // 复用战斗/封面那套设计画布: k = min(容器宽/1920, 容器高/1080, 2560/1920)。见 ui/stage.ts
  const stageScale = useStageScale(viewportRef);

  const [phase, setPhase] = useState<Phase>("idle");
  const [facilityId, setFacilityId] = useState<string | null>(null); // 正在进入/已进入的设施
  // 定时器句柄集中管理: 卸载时一并清掉, 避免演出中途切界面导致卸载后 setState。
  const timers = useRef<number[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => clearTimers, [clearTimers]);
  // 设施背景是 2~3MB 的大图, 进据点就先拉起来 —— 等运镜结束才发请求会淡进一片空底色。
  useEffect(warmFacilityBg, []);

  const scene = facilityId ? FACILITY_SCENES[facilityId] : undefined;
  // 相机: 焦点 → 画框中心的仿射变换(含贴边钳制)。三个分量下发给 CSS, 由 keyframes 按行程插值。
  const cam = scene ? facilityCamera(scene) : null;
  const reduced = prefersReducedMotion(); // 每次渲染读一次: 用户可能中途改系统设置

  function enterFacility(id: string) {
    if (phase !== "idle" || !hasFacilityScene(id)) return;
    clearTimers();
    setFacilityId(id);
    setPhase("entering");
    // 「减少动态效果」: 跳过运镜与飞出, 只留一次短促的背景交叉淡。
    later(() => setPhase("inside"), reduced ? FACILITY_CINEMA.reduced : ENTER_TOTAL);
  }

  function backToTown() {
    if (phase !== "inside") return;
    clearTimers();
    setPhase("leaving");
    later(
      () => {
        setPhase("idle");
        setFacilityId(null);
      },
      reduced ? FACILITY_CINEMA.reduced : FACILITY_CINEMA.leave,
    );
  }

  const inCinema = phase === "entering" || phase === "leaving";
  // 设施背景层从 entering 起就挂载, 但 CSS 给它 crossfadeAt 的 animation-delay + fill both
  // ⇒ 前面一直是 opacity 0, 到 crossfadeAt(推镜尾段)才开始淡入。返回时留到淡出结束。
  const showFacility = phase !== "idle";
  // 设施内的东西(内容层 + 返回按钮): 运镜结束后挂载, 一直留到返回演出走完。
  const inFacility = phase === "inside" || phase === "leaving";
  // 大厅那一层(背景 + 压暗 + 全部界面元素)在交叉淡阶段淡出; inside 时整层卸载, 相机与滤镜一并释放。
  const showHall = phase !== "inside";

  // 时长的唯一真相在 facilityScenes.ts; 「减少动态效果」下整体压成一次短促交叉淡。
  // ⚠ JS 定时器与 CSS 动画读的是同一组数 —— 改时长只改这里, 两头不会对不上。
  const t = reduced
    ? {
        cam: 0,
        at: 0,
        cross: FACILITY_CINEMA.reduced,
        back: FACILITY_CINEMA.reduced,
        leave: FACILITY_CINEMA.reduced,
      }
    : {
        cam: FACILITY_CINEMA.camera,
        at: FACILITY_CINEMA.crossfadeAt,
        cross: FACILITY_CINEMA.crossfade,
        back: FACILITY_CINEMA.backBtnIn,
        leave: FACILITY_CINEMA.leave,
      };

  // 一个飞出元素的 CSS 变量。backIdx = 返回时的飞回次序(与飞出次序相反)。
  // ⚠「减少动态效果」的降级只能在这里做, 不能在 CSS 的 media query 里做 —— 这些变量是内联的,
  //   优先级高于任何样式表规则。故命中时直接下发 0 位移 + 压缩时长, 整段退化成纯不透明度交叉淡。
  const fly = (spec: FlyOut, backIdx: number): CSSProperties =>
    reduced
      ? flyVars({ ...spec, dx: 0, dy: 0, rot: 0 }, 0, FACILITY_CINEMA.reduced)
      : phase === "leaving"
        ? flyVars(spec, flyBackDelay(backIdx), FACILITY_CINEMA.leaveFlyIn)
        : flyVars(spec);

  // 未被点击的 5 块砖依次取用 FLY_TILES 的参数; 被点击的那块走 FLY_PICKED(最后飞)。
  let tileCursor = 0;

  return (
    // letterbox 容器: 铺满窗口, 画布之外的部分是黑边(背景色 #000, 见 .town-viewport)
    <div
      className="town-viewport"
      ref={viewportRef}
      style={{ "--stage-scale": stageScale } as CSSProperties}
    >
      {/* 据点画布 = 固定 1920×1080, 整体等比缩放适配窗口 ⇒ 画面恒为 16:9、构图永不随分辨率变。 */}
      <div
        className={`screen town town-splash${phase === "idle" ? "" : ` is-${phase}`}`}
        style={
          {
            // 相机: 焦点→画框中心的仿射变换。三个分量交给 CSS 的 townCamPush 按行程百分比插值,
            // 于是一套关键帧适配所有设施(见 ui/facilityScenes.ts 的 facilityCamera)。
            "--cam-tx": `${cam?.tx ?? 0}px`,
            "--cam-ty": `${cam?.ty ?? 0}px`,
            "--cam-s": cam?.s ?? 1,
            "--cam-ms": `${t.cam}ms`,
            "--fac-at": `${t.at}ms`,
            "--fac-cross": `${t.cross}ms`,
            "--fac-back-in": `${t.back}ms`,
            "--leave-ms": `${t.leave}ms`,
            "--fac-zoom": reduced ? 1 : 1.04, // 设施背景淡入时的「落地」收缩量
          } as CSSProperties
        }
      >
        {showHall && (
          <>
            {/* 背景层: 2560×1440 的大厅场景图, 与画布同为 16:9 ⇒ cover 只等比缩小, 无裁切无变形。
                ⚠ 相机变换直接下在这两个元素身上 —— 刻意不套包装层, 否则玻璃砖的 backdrop-filter
                取不到背景(见 TownScreen.css 顶部的警告)。 */}
            <img className="town-bg" src={townBg} alt="" draggable={false} />
            {/* 压暗层: 纯装饰, 让毛玻璃砖与角落文字读得清。 */}
            <div className="town-veil" />
          </>
        )}

        {/* 设施场景层: 该设施自己的背景图(16:9)。运镜完毕才淡入, 与大厅那层交叉。 */}
        {showFacility && scene && (
          <img className="town-facility-bg" src={scene.bg} alt="" draggable={false} />
        )}

        {/* 设施内容与「返回据点」都留到 leaving 阶段一起淡出 —— 只在 inside 时渲染的话, 大背景
            还在 700ms 的交叉淡, 上面的面板与按钮却已经硬切消失, 读起来很跳。 */}
        {inFacility && facilityId && FACILITY_CONTENT[facilityId]?.(phase === "leaving")}

        {inFacility && (
          <button
            className={`town-facility-back${phase === "leaving" ? " is-leaving" : ""}`}
            type="button"
            onClick={backToTown}
          >
            ← 返回据点
          </button>
        )}

        {showHall && (
          <>
            <section
              className={`town-status-bar${inCinema ? " is-flying" : ""}`}
              style={inCinema ? fly(FLY_STATUS, 7) : undefined}
              aria-label="据点终端状态"
            >
              <span className="town-status-rim" aria-hidden />
              <div className="town-status-item">
                <span className="town-status-label">生存时间</span>
                <strong className="town-status-value">第 1 日</strong>
              </div>
              <div className="town-status-item">
                <span className="town-status-label">终端积分</span>
                <strong className="town-status-value">{terminalCredits.toLocaleString()}</strong>
              </div>
              <div className="town-status-item">
                <span className="town-status-label">启用设施</span>
                <strong className="town-status-value">
                  {activeFacilities} / {FACILITIES.length}
                </strong>
              </div>
            </section>

            {/* bento 面板: 位置/尺寸/马赛克排布的旋钮全在下面内联 style(设计 px), 直接改数值即可。
              列宽 160+120+150+150+98 + 4×10 缝 = 718 宽; 行高 150+190 + 10 缝 = 350 高。
                改列宽/行高时记得同步 width/height, 否则最后一列/行会被拉伸或留空。 */}
            <div
              className="town-bento"
              style={{
                right: "96px", // ← 距画布右边距离(设计 px)
                bottom: "72px", // ← 距画布底边距离(设计 px)
                width: "718px", // ← 区域总宽 = 各列宽 + 缝
                height: "350px", // ← 区域总高 = 各行高 + 缝
                gap: "10px", // ← 砖块之间的缝隙
                gridTemplateColumns: "160px 120px 150px 150px 98px",
                gridTemplateRows: "150px 190px",
                // ★ 马赛克本体: 同名格连成一块砖 ⇒ 6 块尺寸互不相同, 外轮廓仍是规则矩形。
                //   词必须与 FACILITIES 的 id 完全一致。
                gridTemplateAreas: `
                  "cryo     cryo     worklog medical  medical"
                  "assembly training training training storage"
                `,
              }}
            >
              {FACILITIES.map((f) => {
                // 被点击的那块最后飞出(飞前先亮一下当确认反馈); 其余按马赛克阅读序依次取参数。
                const picked = f.id === facilityId;
                const spec = picked ? FLY_PICKED : FLY_TILES[tileCursor++ % FLY_TILES.length];
                const backIdx = picked ? 0 : FLY_TILES.length - (tileCursor - 1);
                // 锁定块仍是未开放占位: 不挂 onClick, 但刻意不加 disabled, 好让 hover 反馈照常生效。
                const openable = !f.locked && hasFacilityScene(f.id);
                return (
                  <button
                    key={f.id}
                    className={
                      `bento-glass is-${f.size}` +
                      (f.locked ? " is-locked" : "") +
                      (inCinema ? " is-flying" : "") +
                      (picked && phase === "entering" ? " is-picked" : "")
                    }
                    style={{
                      gridArea: f.id,
                      ...(inCinema ? fly(spec, backIdx) : {}),
                      ...(picked ? ({ "--pick-ms": `${PICK_FLASH}ms` } as CSSProperties) : {}),
                    }}
                    type="button"
                    onClick={openable ? () => enterFacility(f.id) : undefined}
                  >
                    <span className="bento-rim" aria-hidden />
                    <span className="bento-icon">{f.icon}</span>
                    <span className="bento-name">{f.name}</span>
                    <span className="bento-desc">{f.desc}</span>
                    {f.locked && <span className="bento-lock">未开放</span>}
                  </button>
                );
              })}
            </div>

            <button
              className={`town-reset${inCinema ? " is-flying" : ""}`}
              style={inCinema ? fly(FLY_RESET, 6) : undefined}
              type="button"
              onClick={() => resetProfile()}
            >
              重置存档
            </button>
          </>
        )}
      </div>
    </div>
  );
}
