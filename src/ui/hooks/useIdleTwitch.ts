import { useEffect, useState } from "react";

// 待机小动作: 每隔 3~6 秒随机挑一个存活敌人抖一下(约 400ms)。
//
// 为什么需要它: 纯循环的待机呼吸(ui/CombatantView.css 的 idleBob)周期恒定, 看久了会露出"这是一段
// 循环动画"的破绽。加一个低频随机事件, 观感立刻从"贴图在动"变成"它在那儿等着"。
//
// 刻意做成 UI 局部状态而不进 BattleState —— 它没有任何规则含义, 且引擎状态必须可序列化/可复现。
export function useIdleTwitch(ids: string[], enabled: boolean): string | null {
  const [twitchId, setTwitchId] = useState<string | null>(null);
  // 依赖用 join 而非数组本身: 每次渲染 ids 都是新数组, 直接当依赖会把定时器重置到永不触发。
  const key = ids.join(",");

  useEffect(() => {
    setTwitchId(null);
    if (!enabled || ids.length === 0) return;
    let clearTimer = 0;
    const tick = () => {
      const pick = ids[Math.floor(Math.random() * ids.length)];
      setTwitchId(pick);
      clearTimer = window.setTimeout(() => setTwitchId(null), TWITCH_MS);
    };
    const timer = window.setInterval(tick, MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP));
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(clearTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return twitchId;
}

const MIN_GAP = 3000;
const MAX_GAP = 6000;
const TWITCH_MS = 400; // 须 ≥ ui/CombatantView.css 里 .combatant.twitch 的动画时长, 否则会被中途摘掉
