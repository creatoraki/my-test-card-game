// 据点(空间站全景) —— 远征之间的常驻中枢: 一张 1920×1080 的全景 + 6 栋可点的建筑。
//
// 与主菜单同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/hooks/stage.ts):
// ★ 本文件里所有坐标/尺寸都是「设计 px」, 直接照着 1920×1080 的设计稿填数就行,
//   任何分辨率下构图逐 px 一致, 画布之外露出的是黑边。
// ⚠ 不要在画布内写 vw/vh 或按窗口宽度的 @media —— 那会让构图重新随分辨率漂移。
//
// ★ 「哪栋建筑 = 哪个设施 / 哪张背景」全在 stationBuildings.ts 一张表里,
//   加一栋建筑不用动本文件。设施内容登记在下面的 FACILITY_CONTENT。
//
// ★ 点建筑会播一段「进设施」演出(时长/位移的真相在 ui/town/facilityScenes.ts):
//   HUD 逐组错峰飞出 → 紧跟着 PixelSwap 把全景像素块化地换成设施背景。
//   ⚠ **没有运镜**: 镜头不推近、不放大, 点哪栋建筑都是原地换场 —— 相机那一套已整体删除。
//
// ★ 「队员宿舍 = 编队页」是个特例: 编队是**顶层全屏页**(不是设施内场景), 但进出照样播这段换场 ——
//   像素铺满的那一刻才切 screen, 返回时由 town/townReturn.ts 的标记让本组件挂载即补播反向段。
//   右下出击坞的「编队」按钮走的也是同一条路(见 enterFormation)。
// ⚠ **出击不是设施**: 它连这段换场都不播, 直接切到顶层全屏页(见右下的 StationDock)。

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { cx } from "@/ui/common/cx";
import PixelSwap from "@/ui/common/PixelSwap";
import { STATION_BG_ART } from "@/ui/art/sceneArt";
import {
  ENTER_TOTAL,
  FACILITY_CINEMA,
  FLY_DOCK,
  FLY_BOT,
  FLY_SETTINGS,
  FLY_STATUS,
  flyBackDelay,
  warmFacilityBg,
  type FlyOut,
} from "@/ui/town/facilityScenes";
import { ResearchScene } from "@/ui/town/terminal/ResearchScene";
import { CryoScene } from "@/ui/town/cryo/CryoScene";
import { ShopScene } from "@/ui/town/shop/ShopScene";
import { AssemblyScene } from "@/ui/town/assembly/AssemblyScene";
import { MuseumScene } from "@/ui/town/museum";
import { FacilityExitProvider, useFacilityExitRegistry } from "@/ui/town/facilityExit";
import { clearTownReturn, peekTownReturn } from "@/ui/town/townReturn";
import { FacilityBack } from "./FacilityBack";
import { StationDock } from "./StationDock";
import { SettingsGearButton } from "./SettingsGearButton";
import { StationBot } from "./StationBot";
import { StationHud } from "./StationHud";
import { StationSettingsPanel } from "./StationSettings";
import { StationLayer } from "./StationLayer";
import { STATION_BUILDINGS, buildingOfFacility, type StationBuilding } from "./stationBuildings";
import { guardSortie, useFormationTodo } from "../formationTodo";
import s from "./TownScreen.module.css";

const isTest = import.meta.env.isTest === "true";

// ===================== 设施内容登记处 =====================
// 设施 id → 进去之后在设施背景上渲染什么。未登记的设施仍是「只有背景 + 返回据点」的空场景。
// ★ 实现一个新设施 = 写一个 <XxxScene>.tsx + 在这里加一行, 本组件其余部分一行都不用动。
// leaving 参数 = 返回据点的演出已开始, 交给设施组件自己做淡出(与背景转场同步)。
const FACILITY_CONTENT: Record<string, (leaving: boolean, onBack: () => void) => ReactNode> = {
  // 工房: 装备升阶 / 羁绊重铸
  assembly: (leaving) => <AssemblyScene leaving={leaving} />,
  // 商店: 货架 / 仓库 / 回收台 / 库存清单
  shop: (leaving) => <ShopScene leaving={leaving} />,
  // 医疗室: 冬眠唤醒 / 营养舱
  cryo: (leaving) => <CryoScene leaving={leaving} />,
  // 研究中心: 模组装配 / 模组制造
  worklog: (leaving) => <ResearchScene leaving={leaving} />,
  // 档案机: 物品 / 卡牌 / 怪物图鉴
  museum: (leaving) => <MuseumScene leaving={leaving} />,
};

// ===================== 进设施演出 =====================
// 阶段机: idle(可交互) → entering(HUD 飞出 + 像素转场) → inside(设施场景) → leaving(反向) → idle。
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

// 背景板。⚠ PixelSwap 会把切换层整份克隆到每个像素上, 所以这一层只放一张图。
function ScenePlate({ src, alt }: { src: string; alt: string }) {
  return <img className={s.plate} src={src} alt={alt} draggable={false} />;
}

export function TownScreen() {
  const resetProfile = useTownStore((state) => state.resetProfile);
  const awakened = useTownStore((state) => state.awakened);
  const grantExp = useTownStore((state) => state.grantExp);
  const bankLoot = useTownStore((state) => state.bankLoot);
  const terminalCredits = useTownStore((state) => state.loot);
  // 生存天数: 只由 townStore.advanceDay 推进(出击打完回据点算一日), 也是商店换货的节拍器。
  const day = useTownStore((state) => state.day);
  const openFormation = useRunStore((state) => state.openFormation);
  const openSortie = useRunStore((state) => state.openSortie);
  const formationTodo = useFormationTodo();

  // 从顶层全屏页(编队)回来的那一次: 本组件是全新挂载的, 若照常停在 idle, 那段反向换场就没了。
  // ⚠ 用 peek 而不是一次性的 take —— StrictMode 下 useState 的初值函数会跑两次, 消费统一放
  //   在下面的挂载 effect 里(clearTownReturn)。
  const returning = buildingOfFacility(peekTownReturn() ?? "") ?? null;

  const [phase, setPhase] = useState<Phase>(returning ? "leaving" : "idle");
  const [building, setBuilding] = useState<StationBuilding | null>(returning); // 正在进入/已进入的建筑
  const [settingsOpen, setSettingsOpen] = useState(false);
  // PixelSwap 的目标态: 点建筑后隔一小段(crossfadeAt, 让 HUD 先起飞)置真, 转场即由此触发。
  // ★ 回据点那一次首帧就是 true: PixelSwap 受控时 shownActive 初值 = active ⇒ 直接显示设施背景
  //   (不播动画), 随后置假才触发反向像素转场 —— 观感与在设施内点「返回据点」逐帧一致。
  const [swapped, setSwapped] = useState(!!returning);
  // 建筑热区层跟着全景背景走: 像素转场一起转它就淡出, 返回时等像素铺回全景才淡回来 ——
  // 它在 PixelSwap 之上, 不跟着走的话会浮在已经换好的设施背景上。
  const [stationShown, setStationShown] = useState(!returning);
  const exit = useFacilityExitRegistry();
  const exitingRef = useRef(false);

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
  // 设施背景是 2~3MB 的大图, 进据点就先拉起来 —— 去掉运镜后点击到转场只隔几百 ms,
  // 等点了才发请求必然切进一片空底色。
  useEffect(warmFacilityBg, []);

  // ⚠ 进设施的收尾交给 PixelSwap 的 onComplete, **不要**只用定时器: 定时器与 PixelSwap 内部的
  //   计时是两条独立时间线, 谁先谁后不保证。phase 一旦切到 inside, 全景那层(含建筑热区)就整个
  //   卸下, 若抢在像素铺满之前发生, 会露出下面还没换完的一角。
  const enterDone = useCallback(() => setPhase((current) => (current === "entering" ? "inside" : current)), []);

  // 像素铺满之后的收尾, 两种目的地共用一个出口:
  //   顶层全屏页(编队) → 此刻才切 screen(据点⇄编队的过场是零时长的, 见 app/transitions.ts);
  //   设施           → 进 inside, 全景那层连同建筑热区一起卸下。
  // ⚠ 只会生效一次: PixelSwap 的 onComplete 与下面的兜底定时器是两条独立时间线, 谁先到算谁。
  const finishedRef = useRef(false);
  const finishEnter = useCallback(
    (target: StationBuilding) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (target.facility === "formation") openFormation();
      else enterDone();
    },
    [enterDone, openFormation],
  );

  function enterFacility(target: StationBuilding) {
    setSettingsOpen(false);
    if (phase !== "idle") return;
    clearTimers();
    finishedRef.current = false;
    setBuilding(target);
    setPhase("entering");
    later(() => {
      setSwapped(true);
      setStationShown(false);
    }, FACILITY_CINEMA.crossfadeAt);
    // 兜底: 正常由 PixelSwap 的 onComplete 收尾, 这条只在回调没来时接住。
    later(() => finishEnter(target), ENTER_TOTAL + 200);
  }

  // 右下出击坞的「编队」按钮 = 点队员宿舍那栋楼, 一整套演出完全复用(含建筑的被选中态)。
  // ⚠ 兜底直切: 万一表里没有哪栋楼绑到编队, 按钮也不能变成哑巴。
  function enterFormation() {
    const target = buildingOfFacility("formation");
    if (target) enterFacility(target);
    else openFormation();
  }

  function requestSortie() {
    if (!formationTodo.pending) {
      openSortie();
      return;
    }
    guardSortie(formationTodo.items, { onSortie: openSortie, onFormation: enterFormation });
  }

  function startLeave() {
    clearTimers();
    setPhase("leaving");
    // 返回按钮先淡出, 再启动反向像素转场; HUD 仍按原节奏稍后逐个飞回。
    later(() => setSwapped(false), FACILITY_CINEMA.backBtnOut);
    later(() => {
      setPhase("idle");
      setBuilding(null);
    }, FACILITY_CINEMA.leave);
  }

  // 从顶层全屏页回来的那一次: 消费掉标记, 并把反向演出接着播完(与设施内点「返回据点」同一条 startLeave)。
  // ⚠ 只跑一次: StrictMode 下 effect 会双调用, startLeave 自带 clearTimers ⇒ 重复执行也只是重排同一批定时器。
  useEffect(() => {
    if (!returning) return;
    clearTownReturn();
    startLeave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function backToTown() {
    if (phase !== "inside" || exitingRef.current) return;
    const wait = exit.closeOpenPanels();
    if (wait <= 0) return startLeave();
    exitingRef.current = true;
    later(() => {
      exitingRef.current = false;
      startLeave();
    }, wait);
  }

  function grantTestRewards() {
    if (!isTest) return;
    grantExp(awakened, 2000);
    bankLoot(10000);
  }

  const inCinema = phase === "entering" || phase === "leaving";
  // 设施内的东西(内容层 + 返回按钮): 像素转场铺满后挂载, 一直留到返回演出走完。
  const inFacility = phase === "inside" || phase === "leaving";
  const facilityId = building?.facility ?? null;

  // HUD 与据点机器人、设置入口在 idle 与演出期间都要在场, 只是演出期间多挂飞出变量。
  const hudProps = {
    day,
    credits: terminalCredits,
    facilityCount: STATION_BUILDINGS.length,
  };

  // 一个飞出单元的 CSS 变量。backIdx = 返回时的飞回次序(与飞出次序相反)。
  const fly = (spec: FlyOut, backIdx: number): CSSProperties =>
    phase === "leaving"
      ? flyVars(spec, flyBackDelay(backIdx), FACILITY_CINEMA.leaveFlyIn)
      : flyVars(spec);

  return (
    <StageCanvas
      viewportClassName={s["town-viewport"]}
      className={cx(s["town-splash"], phase !== "idle" && s[`is-${phase}`])}
      data-town-stage
      style={
        {
          // 返回按钮的进出场时长都由同一组演出常量驱动。
          "--fac-back-in": `${FACILITY_CINEMA.backBtnIn}ms`,
          "--fac-back-out": `${FACILITY_CINEMA.backBtnOut}ms`,
        } as CSSProperties
      }
    >
      {/* 背景: 全景 ⇄ 设施背景。像素块转场由 swapped 驱动, 只有这一层交给 PixelSwap。 */}
      <PixelSwap
        className={s.swap}
        aspectRatio="auto"
        trigger="manual"
        active={swapped}
        pattern="random"
        pixelSize={192}
        duration={FACILITY_CINEMA.crossfade}
        pixelDuration={420}
        onComplete={(active) => {
          if (active) {
            if (building) finishEnter(building);
            return;
          }
          setStationShown(true);
        }}
        firstContent={<ScenePlate src={STATION_BG_ART} alt="空间站全景" />}
        secondContent={building ? <ScenePlate src={building.bg} alt={building.label} /> : null}
      />

      {/* 建筑热区: 与背景图共用 1920×1080 坐标, 直接叠在全景之上(没有相机变换要跟)。 */}
      <div className={s["station-layer"]} data-visible={phase !== "inside" && stationShown}>
        <StationLayer
          onEnter={enterFacility}
          pickedId={phase === "entering" ? building?.id ?? null : null}
        />
      </div>

      {/* HUD 与出击坞在 inside 之外一直挂着(leaving 时要飞回来), 只有演出期间多挂一组飞出变量。 */}
      {phase !== "inside" && (
        <>
          <StationHud
            {...hudProps}
            flyingClassName={inCinema ? s["is-flying"] : undefined}
            statusStyle={inCinema ? fly(FLY_STATUS, 3) : undefined}
          />
          <div
            className={cx(inCinema && s["is-flying"])}
            style={inCinema ? fly(FLY_SETTINGS, 2) : undefined}
          >
            <SettingsGearButton onClick={() => setSettingsOpen(true)} />
          </div>
          <div
            className={cx(inCinema && s["is-flying"])}
            style={inCinema ? fly(FLY_BOT, 1) : undefined}
          >
            <StationBot />
          </div>
          {/* 出击坞整组是一个飞出单元: 外面套一层只管动画的壳, 组件自己不必知道演出的存在。 */}
          <div
            className={cx(inCinema && s["is-flying"])}
            style={inCinema ? fly(FLY_DOCK, 0) : undefined}
          >
            <StationDock
              onFormation={enterFormation}
              onSortie={requestSortie}
              formationPending={formationTodo.pending}
            />
          </div>
          <StationSettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onResetProfile={resetProfile}
            onTestReward={isTest ? grantTestRewards : undefined}
          />
        </>
      )}

      {/* 设施内容与「返回据点」都留到 leaving 阶段一起淡出 —— 只在 inside 时渲染的话, 背景
          还在做像素转场, 上面的面板与按钮却已经硬切消失, 读起来很跳。 */}
      {inFacility && facilityId && FACILITY_CONTENT[facilityId] && (
        <FacilityExitProvider register={exit.register}>
          {FACILITY_CONTENT[facilityId](phase === "leaving", backToTown)}
          <FacilityBack leaving={phase === "leaving"} onClick={backToTown} />
        </FacilityExitProvider>
      )}
    </StageCanvas>
  );
}
