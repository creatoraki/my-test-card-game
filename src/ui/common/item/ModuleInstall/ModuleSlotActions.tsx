// 模组格子上的两个悬浮按钮 —— 战利品盘与探索拾取框共用。
//
// 模组是唯一有两条去向的战利品: 装到卡上(不占背包格)或先收进背包带回据点。
// 以前要点一下格子再从弹出菜单里选, 现在两条去向竖排贴在图标右下角、跨出右边框, 悬停即现。
// 组件只管长相与点击, 具体做什么由 useLootModuleActions 接线。

import type { MouseEvent } from "react";
import s from "./ModuleSlotActions.module.css";

interface Props {
  /** 远征外(没有会话)不提供装载入口, 只能收进背包。 */
  canInstall?: boolean;
  onInstall: () => void;
  onTake: () => void;
}

export function ModuleSlotActions({ canInstall = true, onInstall, onTake }: Props) {
  // 按钮压在 ItemSlot 上方, 点击不能再冒泡触发整格的「点一下就拾取」。
  const fire = (event: MouseEvent<HTMLButtonElement>, run: () => void) => {
    event.stopPropagation();
    event.preventDefault();
    run();
  };

  return (
    <div className={s.actions}>
      <button
        className={s.btn}
        type="button"
        disabled={!canInstall}
        onClick={(event) => fire(event, onInstall)}
      >
        装载
      </button>
      <button
        className={s.btn}
        type="button"
        onClick={(event) => fire(event, onTake)}
      >
        拾取
      </button>
    </div>
  );
}
