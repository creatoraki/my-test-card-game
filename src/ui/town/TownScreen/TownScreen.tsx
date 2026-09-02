// 据点(大厅) —— 远征之间的常驻中枢: 大厅背景图 + 右下 12×4 错缝立体 bento 入口。
//
// 与主菜单同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/stage.ts):
// ★ 本文件里所有坐标/尺寸都是「设计 px」(1920×1080 基准), 直接照着 1920×1080 的设计稿填数就行,
//   任何分辨率下构图逐 px 一致, 画布之外露出的是黑边。
// ⚠ 不要在画布内写 vw/vh 或按窗口宽度的 @media —— 那会让构图重新随分辨率漂移。
//
// ★ 入口布局由 TownBento 负责: 12 条微列 × 4 行错缝拼法, 砖块各自 translateZ 投影, 底板整体带透视倾斜。
//   跨格几何、设施顺序和光效参数都收在 TownBento 模块, 本页只负责阶段机与入口分流。
//
// ★ 点击冬眠仓 / 训练室 / 控制终端 / 物资中转仓 / 商店会播一段「进设施」演出
//   (见下方 enterFacility 与 ui/facilityScenes.ts):
//   镜头推向该设施在大厅里的位置并放大 → 界面元素逐个错峰飞出 → 大厅背景淡出、设施背景淡入。
//
// ★ 设施内容登记在下面的 FACILITY_CONTENT: 目前有**控制终端**(ui/ControlTerminalScene.tsx ——
//   只剩委托占位)、**冬眠仓**(ui/CryoScene.tsx —— 只剩唤醒队员)、
//   **物资中转仓**(ui/StorageScene.tsx)、**商店**(ui/ShopScene.tsx —— 按天刷新的货架)
//   与**训练室**(ui/TrainingScene.tsx —— 小队徽章与训练点分配)。
//
// ★ **不是所有砖都是设施**: Facility.kind === "screen" 的砖(目前是「编队」与「出击」)点下去
//   不播运镜, 而是直接切到一个顶层全屏页(见下面 SCREEN_TILES 的分流表)。
//
// ⚠ 「回主菜单」仍然没有入口(角落只剩「重置存档」), 但据点**已不再是死路** ——
//   出击砖 → 选地图 → 备物资 → 出击 会接上 runStore.startExpedition 进探索牌局;
//   编队是右侧 bento 上的一级入口。

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { toggleBgm, useBgmEnabled } from "@/ui/hooks/useBgm";
import { toggleSfx, useSfxEnabled } from "@/ui/hooks/useSfx";
import {
  ENTER_TOTAL,
  FACILITY_CINEMA,
  FACILITY_SCENES,
  FLY_PICKED,
  FLY_RESET,
  FLY_STATUS,
  FLY_TILES,
  facilityCamera,
  flyBackDelay,
  hasFacilityScene,
  warmFacilityBg,
  type FlyOut,
} from "@/ui/town/facilityScenes";
import { cx } from "@/ui/common/cx";
import { TownBento, TOWN_FACILITIES, type TownFacility } from "@/ui/town/TownBento";
import { ControlTerminalScene } from "@/ui/town/terminal/ControlTerminalScene";
import { CryoScene } from "@/ui/town/cryo/CryoScene";
import { ShopScene } from "@/ui/town/shop/ShopScene";
import { StorageScene } from "@/ui/town/storage/StorageScene";
import { AssemblyScene } from "@/ui/town/assembly/AssemblyScene";
import { TrainingScene } from "@/ui/town/training/TrainingScene";
import { TOWN_BG_ART } from "@/ui/art/sceneArt";
import s from "./TownScreen.module.css";

const isTest = import.meta.env.isTest === "true";

function MusicIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 35V12l22-5v23" strokeWidth={1.8} />
      <circle cx="11" cy="36" r="6" strokeWidth={1.8} />
      <circle cx="33" cy="31" r="6" strokeWidth={1.8} />
      {muted && <path d="m7 9 34 31" strokeWidth={2.4} />}
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 20h8l10-8v24l-10-8H8z" strokeWidth={1.8} />
      {!muted && <path d="M31 18c3 3 3 9 0 12M35 13c6 6 6 16 0 22" strokeWidth={1.5} opacity={0.72} />}
      {muted && <path d="m8 9 33 31" strokeWidth={2.4} />}
    </svg>
  );
}

// ===================== 设施内容登记处 =====================
// 设施 id → 进去之后在设施背景上渲染什么。未登记的设施仍是「只有背景 + 返回据点」的空场景。
// ★ 实现一个新设施 = 写一个 ui/<XxxScene>.tsx + 在这里加一行, 本组件其余部分一行都不用动。
// leaving 参数 = 返回据点的演出已开始, 交给设施组件自己做淡出(与背景交叉淡同步)。
const FACILITY_CONTENT: Record<string, (leaving: boolean, onBack: () => void) => ReactNode> = {
  worklog: (leaving) => <ControlTerminalScene leaving={leaving} />,
  cryo: (leaving) => <CryoScene leaving={leaving} />,
  storage: (leaving) => <StorageScene leaving={leaving} />,
  assembly: (leaving) => <AssemblyScene leaving={leaving} />,
  shop: (leaving) => <ShopScene leaving={leaving} />,
  training: (leaving, onBack) => <TrainingScene leaving={leaving} onBack={onBack} />,
};

// 这些设施把返回动作收进自己的面板, 避免同一场景出现两个出口。
const FACILITY_SELF_EXIT = new Set(["training"]);

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
  const awakened = useTownStore((s) => s.awakened);
  const grantExp = useTownStore((s) => s.grantExp);
  const bankLoot = useTownStore((s) => s.bankLoot);
  const bgmEnabled = useBgmEnabled();
  const sfxEnabled = useSfxEnabled();
  const openFormation = useRunStore((s) => s.openFormation);
  const openSortie = useRunStore((s) => s.openSortie);
  const terminalCredits = useTownStore((s) => s.loot);
  // 生存天数: 只由 townStore.advanceDay 推进(出击打完回据点算一日), 也是商店换货的节拍器。
  const day = useTownStore((s) => s.day);
   const activeFacilities = TOWN_FACILITIES.filter((facility) => !facility.locked).length;

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

  function grantTestRewards() {
    if (!isTest) return;
    grantExp(awakened, 2000);
    bankLoot(10000);
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

   // 飞出参数按设施阅读序预先排好, 回调里 O(1) 查表; 被点的砖最后飞出。
   const flyById = useMemo(() => {
     const result: Record<string, { spec: FlyOut; backIdx: number }> = {};
    if (!facilityId) return result;
     let tileCursor = 0;
     TOWN_FACILITIES.forEach((facility) => {
       if (facility.id === facilityId) {
         result[facility.id] = { spec: FLY_PICKED, backIdx: 0 };
         return;
       }
       const spec = FLY_TILES[tileCursor++];
       result[facility.id] = { spec, backIdx: FLY_TILES.length - tileCursor + 1 };
     });
     return result;
   }, [facilityId]);

  return (
    <StageCanvas
      viewportClassName={s["town-viewport"]}
      className={cx(s["screen"], s["town"], s["town-splash"], phase !== "idle" && s[`is-${phase}`])}
      data-town-stage
      style={
        {
          "--cam-tx": `${cam?.tx ?? 0}px`,
          "--cam-ty": `${cam?.ty ?? 0}px`,
          "--cam-s": cam?.s ?? 1,
          "--cam-ms": `${t.cam}ms`,
          "--fac-at": `${t.at}ms`,
          "--fac-cross": `${t.cross}ms`,
          "--fac-back-in": `${t.back}ms`,
          "--leave-ms": `${t.leave}ms`,
          "--fac-zoom": reduced ? 1 : 1.04,
        } as CSSProperties
      }
    >
        {showHall && (
          <>
            {/* 背景层: 2560×1440 的大厅场景图, 与画布同为 16:9 ⇒ cover 只等比缩小, 无裁切无变形。
                ⚠ 相机变换直接下在这两个元素身上 —— 刻意不套包装层, 否则玻璃砖的 backdrop-filter
                取不到背景(见 TownScreen.css 顶部的警告)。 */}
            <img className={s["town-bg"]} src={TOWN_BG_ART} alt="" draggable={false} />
            {/* 压暗层: 纯装饰, 让毛玻璃砖与角落文字读得清。 */}
            <div className={s["town-veil"]} />
          </>
        )}

        {/* 设施场景层: 该设施自己的背景图(16:9)。运镜完毕才淡入, 与大厅那层交叉。 */}
        {showFacility && scene && (
          <img className={s["town-facility-bg"]} src={scene.bg} alt="" draggable={false} />
        )}

        {/* 设施内容与「返回据点」都留到 leaving 阶段一起淡出 —— 只在 inside 时渲染的话, 大背景
            还在 700ms 的交叉淡, 上面的面板与按钮却已经硬切消失, 读起来很跳。 */}
        {inFacility && facilityId && FACILITY_CONTENT[facilityId]?.(phase === "leaving", backToTown)}

        {inFacility && !(facilityId && FACILITY_SELF_EXIT.has(facilityId)) && (
          <button
            className={cx(s["town-facility-back"], phase === "leaving" && s["is-leaving"])}
            type="button"
            onClick={backToTown}
          >
            ← 返回据点
          </button>
        )}

        {showHall && (
          <>
            <section
              className={cx(s["town-status-bar"], inCinema && s["is-flying"])}
              style={inCinema ? fly(FLY_STATUS, 10) : undefined}
              aria-label="据点终端状态"
            >
              <span className={s["town-status-rim"]} aria-hidden />
              <div className={s["town-status-item"]}>
                <span className={s["town-status-label"]}>生存时间</span>
                <strong className={s["town-status-value"]}>第 {day} 日</strong>
              </div>
              <div className={s["town-status-item"]}>
                <span className={s["town-status-label"]}>终端积分</span>
                <strong className={s["town-status-value"]}>{terminalCredits.toLocaleString()}</strong>
              </div>
              <div className={s["town-status-item"]}>
                <span className={s["town-status-label"]}>启用设施</span>
                <strong className={s["town-status-value"]}>
                  {activeFacilities} / {TOWN_FACILITIES.length}
                </strong>
              </div>
            </section>

            <TownBento
              pickedId={phase === "entering" ? facilityId : null}
              brickClassName={() => (inCinema ? s["is-flying"] : undefined)}
              brickStyle={(id) => {
                const flight = flyById[id];
                return inCinema && flight ? fly(flight.spec, flight.backIdx) : undefined;
              }}
              onOpen={(facility: TownFacility) => {
                if (phase !== "idle") return;
                if (facility.kind === "screen") {
                  facility.id === "formation" ? openFormation() : openSortie();
                  return;
                }
                enterFacility(facility.id);
              }}
            />

            <button
              className={cx(s["town-audio-toggle"], inCinema && s["is-flying"])}
              style={inCinema ? fly(FLY_RESET, 9) : undefined}
              type="button"
              aria-label={bgmEnabled ? "关闭音乐" : "播放音乐"}
              aria-pressed={bgmEnabled}
              data-muted={!bgmEnabled}
              onClick={toggleBgm}
            >
              <MusicIcon muted={!bgmEnabled} />
              <span>{bgmEnabled ? "音乐播放中" : "音乐已关闭"}</span>
            </button>

            <button
              className={cx(s["town-audio-toggle"], s["town-sfx-toggle"], inCinema && s["is-flying"])}
              style={inCinema ? fly(FLY_RESET, 9) : undefined}
              type="button"
              aria-label={sfxEnabled ? "关闭音效" : "开启音效"}
              aria-pressed={sfxEnabled}
              data-muted={!sfxEnabled}
              onClick={toggleSfx}
            >
              <SoundIcon muted={!sfxEnabled} />
              <span>{sfxEnabled ? "音效开启" : "音效关闭"}</span>
            </button>

            {isTest && (
              <button
                className={cx(s["town-reset"], s["town-test-reward"], inCinema && s["is-flying"])}
                style={inCinema ? fly(FLY_RESET, 9) : undefined}
                type="button"
                aria-label="发放测试奖励"
                onClick={grantTestRewards}
              >
                测试奖励
              </button>
            )}

            <button
              className={cx(s["town-reset"], inCinema && s["is-flying"])}
              style={inCinema ? fly(FLY_RESET, 9) : undefined}
              type="button"
              onClick={() => resetProfile()}
            >
              重置存档
            </button>
          </>
        )}
    </StageCanvas>
  );
}
