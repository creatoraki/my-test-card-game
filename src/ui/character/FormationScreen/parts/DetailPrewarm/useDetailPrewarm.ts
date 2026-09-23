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

import { useEffect, useState } from "react";
import { scheduleLowPriority } from "@/ui/art/loader/assetLoader";

// 已经热过的角色。模块级 ⇒ 反复进出编队页不重复付账; 又因为是按 id 记的,
// 本局后来才唤醒的新队员下次进页面仍会被补上。
const warmed = new Set<string>();

/**
 * @param roster  编队页当前的展示名册(顺序即预热顺序)。
 * @param enabled 只在编队态且没有过场在跑时为 true —— 玩家一点卡就立刻让位, 绝不和真实过场抢主线程。
 * @returns 这一步该预热的角色 id; null = 不挂预热层。
 */
export function useDetailPrewarm(roster: readonly string[], enabled: boolean): string | null {
  const [target, setTarget] = useState<string | null>(null);

  // 排下一位。⚠ 连第一位也走空闲回调: 页面入场动画期间浏览器并不空闲, requestIdleCallback
  //   天然会把预热排到动画之后, 不必再手写一层等待。
  useEffect(() => {
    if (!enabled || target) return;
    const next = roster.find((id) => !warmed.has(id));
    if (!next) return;
    let cancelled = false;
    scheduleLowPriority(() => {
      if (!cancelled) setTarget(next);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, target, roster]);

  // 这一位**真的绘制过一帧**之后才算热完, 再轮下一位。
  // ⚠ 必须双 rAF: 单个 rAF 回调跑在本帧绘制**之前**, 那会儿这棵树还没落到屏幕上。
  useEffect(() => {
    if (!target) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        warmed.add(target);
        setTarget(null);
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [target]);

  // 玩家点开详情(或过场起跑): 预热层立刻卸载; 这一位没热完就留给下一次, 不记账。
  useEffect(() => {
    if (!enabled) setTarget(null);
  }, [enabled]);

  return enabled ? target : null;
}
