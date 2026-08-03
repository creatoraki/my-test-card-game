// 场景过场编排: 界面切换时把「瞬移」拆成 旧界面出场 → 黑场停顿 → 新界面入场。
//
// 用 render 回调而非 children: 出场期间要继续渲染的是「旧」界面, 而 App 传下来的
// screen 此刻已经是新的了 —— 只有回调形式才能按内部的 shown 去渲染旧界面。
//
// 串行(旧的先卸载、新的再挂载)是刻意的: 两个界面同时挂载会让 BattleScreen 双挂载,
// 背景视频双解码、素材双预热、定时器串批。串行则天然避开。
//
// 时序/特效全部来自 transitions.ts 的预设表, 本组件不含任何硬编码时长。

import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { Screen } from "@/store/runStore";
import { cx } from "@/ui/common/cx";
import { BattleTransitionCurtain } from "@/ui/app/BattleTransitionCurtain";
import { takeTransitionOrigin, type TransitionOrigin } from "@/ui/app/transitionOrigin";
import {
  BATTLE_RIPPLE_MS,
  BATTLE_RIPPLE_START_MS,
  prefersReducedMotion,
  resolveTransition,
  type TransitionSpec,
} from "@/ui/app/transitions";
import s from "./ScreenTransition.module.css";
// ⚠ 全局普通 CSS, 刻意不转 Modules: 里面只有 :root 变量与 ::view-transition-* 文档根伪元素,
//   没有一个类名 —— 哈希无从谈起。见 app/viewTransition.global.css 的文件头。
import "@/ui/app/viewTransition.global.css";

interface Props {
  screen: Screen; // 目标界面(来自 runStore)
  render: (screen: Screen) => ReactNode; // 按界面渲染对应组件
}

type Phase = "idle" | "exit" | "enter";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

// 过场期间挂在 <html> 上的路线标记, 形如 data-vt-route="formation>charDetail"。
// ★ ::view-transition-* 是**文档根**上的伪元素, 不属于任何一页 ⇒ CSS 只能靠它区分
//   "这次是哪条路线在过场"。没有它, 探索→战斗那套 root 规则会无差别命中所有 VT 路线。
const VT_ROUTE_ATTR = "vtRoute";

export function ScreenTransition({ screen, render }: Props) {
  const [shown, setShown] = useState<Screen>(screen); // 当前实际渲染的界面
  const [phase, setPhase] = useState<Phase>("idle");
  const [spec, setSpec] = useState<TransitionSpec | null>(null); // 本次切换生效的预设
  const [runId, setRunId] = useState(0); // 递增批次号, 兼作 key 强制重放入场动画
  const [origin, setOrigin] = useState<TransitionOrigin | null>(null); // 一次过场固定一个圆心，exit/enter 必须共用

  const seqRef = useRef(0); // 批次序号: 快速连点时作废旧批次的定时器回调
  const timersRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("idle"); // phase 的同步镜像: 让下面的 effect 读到它又不必把它列进依赖
  phaseRef.current = phase;
  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (screen === shown) {
      // 目标又变回了当前正在渲染的界面(快速来回点)。只有「出场中」需要撤销 ——
      // 那批定时器再触发就会切到一个已经作废的目标。
      // 「入场中」绝不能碰: 这个分支在 swap 后的那一帧必然命中(shown 刚被设成 screen),
      // 清掉定时器会误杀收尾回调, 让动画类永久残留在 battle 的祖先上。
      if (phaseRef.current === "exit") {
        clearTimers();
        seqRef.current++;
        setPhase("idle");
        setSpec(null);
      }
      return;
    }

    const next = resolveTransition(shown, screen);

    // ── 原生 View Transition 路线(编队 ↔ 角色详情的共享元素过场) ──
    // ⚠ 必须排在下面那条「零时长早退」**之前**: 这类路线的 exit/enter 都是 0(时长归 CSS),
    //   落进早退分支就变成瞬切了。
    if (next.viewTransition) {
      clearTimers();
      const seq = ++seqRef.current;
      const root = document.documentElement;
      // update 回调里必须**同步**提交新 DOM, 浏览器才能在这一帧抓到新界面的快照。
      const commit = () => flushSync(() => setShown(screen));
      const viewDocument = document as ViewTransitionDocument;
      const transition = !prefersReducedMotion()
        ? viewDocument.startViewTransition?.(commit)
        : undefined;

      // 降级(浏览器不支持 / 系统要求减少动效): 直接瞬切, 不做任何动画。
      if (!transition) {
        commit();
        setPhase("idle");
        setSpec(null);
        return;
      }

      // ⚠ 必须在 startViewTransition **之后、await 之前**同步挂上: 旧快照已经抓完(抓的是像素,
      //   与本属性无关), 而伪元素的样式是在动画阶段才解析的, 此刻挂上正好赶得及。
      root.dataset[VT_ROUTE_ATTR] = `${shown}>${screen}`;
      // 全程不动 phase / runId: 包裹层绝不能挂动画类, 更不能被 key 重挂载 ——
      // 那会把浏览器刚抓好的新快照连根拔掉。
      transition.finished.finally(() => {
        delete root.dataset[VT_ROUTE_ATTR];
        if (seq !== seqRef.current) return;
        setPhase("idle");
        setSpec(null);
      });
      return;
    }

    // 零时长(总开关关闭 / 系统要求减少动效): 直接切, 不设定时器、不加动画类。
    if (next.exit.ms === 0 && next.enter.ms === 0) {
      clearTimers();
      seqRef.current++;
      setShown(screen);
      setPhase("idle");
      setSpec(null);
      return;
    }

    clearTimers();
    const seq = ++seqRef.current;
    // 原点只在本轮开始时消费一次，不能在 exit → enter 的 phase 切换时再读，否则会丢失点击位置。
    setOrigin(next.curtain === "battle-ripple" ? takeTransitionOrigin() : null);
    setSpec(next);
    setPhase("exit");

    const swap = window.setTimeout(() => {
      if (seq !== seqRef.current) return;
      if (next.curtain === "battle-ripple") {
        const x = originRef.current?.x ?? window.innerWidth / 2;
        const y = originRef.current?.y ?? window.innerHeight / 2;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        const update = () => {
          // View Transition 的 update 回调中必须同步提交新 DOM，浏览器才能抓到战斗场景的新快照。
          flushSync(() => {
            setShown(screen);
          });
        };
        const viewDocument = document as ViewTransitionDocument;
        const transition = !prefersReducedMotion() ? viewDocument.startViewTransition?.(update) : undefined;

        if (!transition) {
          update();
          const settle = window.setTimeout(() => {
            if (seq !== seqRef.current) return;
            setPhase("idle");
            setSpec(null);
          }, BATTLE_RIPPLE_MS);
          timersRef.current.push(settle);
          return;
        }

        // 与上面的共享元素分支同一条机制: ScreenTransition.module.css 里那几条 root 规则已经收窄到
        // 本路线, 不挂这个标记裂纹涟漪就没有画面了。
        const root = document.documentElement;
        root.dataset[VT_ROUTE_ATTR] = "explore>battle";
        root.style.setProperty("--vt-impact-x", `${x}px`);
        root.style.setProperty("--vt-impact-y", `${y}px`);
        root.style.setProperty("--vt-glass-break-ms", `${BATTLE_RIPPLE_MS}ms`);
        transition.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${radius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: BATTLE_RIPPLE_MS,
                easing: "linear",
                fill: "both",
                pseudoElement: "::view-transition-new(root)",
              },
            );
          })
          .catch(() => undefined);
        transition.finished.finally(() => {
          delete root.dataset[VT_ROUTE_ATTR];
          root.style.removeProperty("--vt-impact-x");
          root.style.removeProperty("--vt-impact-y");
          root.style.removeProperty("--vt-glass-break-ms");
          if (seq !== seqRef.current) return;
          setPhase("idle");
          setSpec(null);
        });
        return;
      }
      setShown(screen); // 旧界面在此刻卸载, 新界面挂载
      setPhase("enter");
      setRunId((n) => n + 1);

      const settle = window.setTimeout(() => {
        if (seq !== seqRef.current) return;
        setPhase("idle"); // 归位: 去掉动画类, 让 battle 回到无 transform 的静息态
        setSpec(null);
      }, next.enter.ms);
      timersRef.current.push(settle);
    }, next.curtain === "battle-ripple" ? BATTLE_RIPPLE_START_MS : next.exit.ms + next.hold);
    timersRef.current.push(swap);
  }, [screen, shown]);

  const fx = phase === "exit" ? spec?.exit : phase === "enter" ? spec?.enter : null;
  const originRef = useRef<TransitionOrigin | null>(null);
  originRef.current = origin;

  return (
    <>
      <div
        key={runId} // 重挂载 → 入场动画每次都从头播(与 HandCard/SkillCutInCard 的 key 重放范式一致)
        // ⚠ 原先是 `.screen-transition[class*="screen-fx-"]` 靠属性子串选择器认「有没有挂特效」。
        //   CSS Modules 哈希之后类名不再以 screen-fx- 开头, 那个写法直接失效 ⇒ 改成显式的
        //   .is-fx 标记类; 具体哪一档特效仍走 s[`screen-fx-${name}`] 查表(名单在 app/transitions.ts)。
        className={cx(s["screen-transition"], fx && s["is-fx"], fx && s[`screen-fx-${fx.name}`])}
        style={fx ? { animationDuration: `${fx.ms}ms` } : undefined}
      >
        {render(shown)}
      </div>
      {spec?.curtain === "battle-ripple" && phase !== "idle" ? (
        <BattleTransitionCurtain key={phase} phase={phase} origin={origin} />
      ) : spec?.curtain && phase !== "idle" ? (
        <div
          // ⚠ key 跟着 phase 变: 幕布是同一个元素跨越 exit/enter 两相的, 不重挂载就只会播
          //   exit 那一段, 入场那段动画永远不出现。
          key={phase}
          className={cx(s["screen-curtain"], s[`curtain-${spec.curtain}`])}
          data-phase={phase}
          aria-hidden
        />
      ) : null}
    </>
  );
}
