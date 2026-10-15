// 未开放建筑上的锁头 —— GLSL 绘制的全息挂锁 + 悬停时浮出的开放条件。
// ★ 是叠在建筑 SVG 之上的 HTML 层(着色器画布进不了 SVG), 自身不接收指针: 悬停/点击仍由
//   下面的建筑剪影命中区处理, 再把状态(hovered / denying / unlocking)传进来。
// ★ 开锁演出靠换 key 重新挂载 GlslSprite, 让着色器的 uPhase 从 0 起算开锁时间轴。

import {
  PADLOCK_GEOMETRY,
  PADLOCK_PROGRAM,
  PADLOCK_UNIFORMS,
  PADLOCK_UNLOCK_UNIFORMS,
} from "@/ui/art/lock";
import { GlslSprite } from "@/ui/common/fx/GlslSprite";
import { cx } from "@/ui/common/shared/cx";
import type { StationBuilding } from "../../stationBuildings";
import s from "./BuildingLock.module.css";

export interface BuildingLockProps {
  building: StationBuilding;
  /** 开放条件, 如「通关新手关卡后开放」。 */
  reason: string;
  /** 指针悬停或键盘聚焦在这栋楼上: 浮出开放条件。 */
  hovered: boolean;
  /** 刚点过这栋楼: 锁头抖动闪光, 条件牌同步抖一下。 */
  denying: boolean;
  /** 正在播开锁演出: 锁头碎散, 条件牌换成「已开放」。 */
  unlocking: boolean;
  seed: number;
}

export function BuildingLock({ building, reason, hovered, denying, unlocking, seed }: BuildingLockProps) {
  return (
    <div
      className={cx(
        s.lock,
        (hovered || denying || unlocking) && s.isShown,
        denying && !unlocking && s.isDenying,
        unlocking && s.isUnlocking,
      )}
      style={{ left: building.lock.x, top: building.lock.y }}
      aria-hidden="true"
    >
      <GlslSprite
        key={unlocking ? "unlock" : "idle"}
        className={s.sprite}
        program={PADLOCK_PROGRAM}
        width={PADLOCK_GEOMETRY.width}
        height={PADLOCK_GEOMETRY.height}
        uniforms={unlocking ? PADLOCK_UNLOCK_UNIFORMS : PADLOCK_UNIFORMS}
        active={denying && !unlocking}
        seed={seed}
      />
      <div className={s.plate}>
        <span className={s.state}>{unlocking ? "已开放" : "未开放"}</span>
        <span className={s.reason}>{unlocking ? building.label : reason}</span>
      </div>
    </div>
  );
}
