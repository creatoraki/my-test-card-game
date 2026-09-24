// 详情态「空闲预热」的调度 —— 只解决一个现象: 进编队页后**第一次**点角色卡, 重组过场会掉帧,
// 返回再点就丝滑了。
//
// ★ 卡的不是编排, 是一笔**只在详情树首次上屏时付一次**的账:
//     · 整棵 CharacterDetailView(Workbench 外壳 + 三组 StatGroupCard + 21 行 AttrRow, 每行一枚
//       内联 SVG 徽记)第一次做样式匹配与布局;
//     · 详情态 CSS 里十余处 clip-path: polygon(...) 第一次生成 mask 纹理
//       (Workbench 的 .head-edge 还是 evenodd 的 18 点 hairline 路径);
//     · 1152×2048 的角色立绘第一次以详情尺寸(434×772 设计 px)重采样并上传 GPU,
//       FigureStage 里那张 1920×1080 场景图也第一次以 480×772 绘制。
//   useFormationMorph 的双 rAF 只是把这笔账挪了个时刻, 挪不掉 —— 它照样落在那 620ms 过场中间。
// ★ 于是趁玩家还没点卡的空闲时段, 把详情树在离屏层里真绘制一遍, 把账提前付掉。
//
// ⚠ assetPreloader 保证的是「下载 + 一次 decode」, 保证不了「以详情页那个尺寸绘制过」——
//   每位角色的立绘是各自独立的 PNG, 解码缓存互不相通, 所以要**逐位**轮一遍。
//
// ⚠⚠ 开工时刻必须等卡阵入场动画播完(startAfterMs)。入场动画只动 transform/opacity, 跑在合成线程上,
//   主线程在浏览器眼里是「空闲」的, requestIdleCallback 照样会立刻回调 —— 旧版正是这样把第一笔
//   (也是最重的一笔: 整棵详情树的首次挂载 + 光栅化)压在了入场动画中间, 表现为进页面卡一下。
// ⚠⚠ 轮换期间预热层**不卸载**, 只换 charId: 第一步付掉结构的账之后, 后面每步 React 只 diff 出
//   立绘与几个数字。旧版每步之间先置 null 再挂下一位, 等于每位角色都把整棵树重建一遍。

import { useEffect, useState } from "react";
import { scheduleLowPriority } from "@/ui/art/loader/assetLoader";

// 已经热过的角色。模块级 ⇒ 反复进出编队页不重复付账; 又因为是按 id 记的,
// 本局后来才唤醒的新队员下次进页面仍会被补上。
const warmed = new Set<string>();

/**
 * @param roster       编队页当前的展示名册(顺序即预热顺序)。
 * @param enabled      只在编队态且没有过场在跑时为 true —— 玩家一点卡就立刻让位, 绝不和真实过场抢主线程。
 * @param startAfterMs 挂载后至少等这么久才开工(卡阵入场动画的总时长)。
 * @returns 这一步该预热的角色 id; null = 不挂预热层。
 */
export function useDetailPrewarm(roster: readonly string[], enabled: boolean, startAfterMs = 0): string | null {
  const [started, setStarted] = useState(startAfterMs <= 0);
  const [target, setTarget] = useState<string | null>(null);
  // 当前这一位是否已真正绘制过一帧。与 warmed 分开记: warmed 是模块级的, 改它不会触发重渲染。
  const [painted, setPainted] = useState(false);

  // 等入场动画播完。
  useEffect(() => {
    if (started) return;
    const timer = window.setTimeout(() => setStarted(true), startAfterMs);
    return () => window.clearTimeout(timer);
  }, [started, startAfterMs]);

  const active = enabled && started;

  // 排下一位(当前没有目标, 或当前这一位已经热完)。
  // ⚠ 连第一位也走空闲回调: 等入场结束后仍可能有别的主线程任务, 让它们先走。
  useEffect(() => {
    if (!active) return;
    if (target && !painted) return;
    const next = roster.find((id) => !warmed.has(id));
    if (!next) {
      // 全员热完: 卸掉预热层, 之后编队态不再背着一整棵隐藏的详情树。
      if (target) setTarget(null);
      return;
    }
    let cancelled = false;
    scheduleLowPriority(() => {
      if (cancelled) return;
      setTarget(next);
      setPainted(false);
    });
    return () => {
      cancelled = true;
    };
  }, [active, target, painted, roster]);

  // 这一位**真的绘制过一帧**之后才算热完, 再轮下一位。
  // ⚠ 必须双 rAF: 单个 rAF 回调跑在本帧绘制**之前**, 那会儿这棵树还没落到屏幕上。
  useEffect(() => {
    if (!active || !target || painted) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        warmed.add(target);
        setPainted(true);
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [active, target, painted]);

  // 玩家点开详情(或过场起跑): 预热层立刻卸载; 这一位没热完就留给下一次, 不记账。
  useEffect(() => {
    if (!enabled) {
      setTarget(null);
      setPainted(false);
    }
  }, [enabled]);

  return active ? target : null;
}
