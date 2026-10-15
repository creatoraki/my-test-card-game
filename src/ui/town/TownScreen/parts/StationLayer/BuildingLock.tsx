// 未开放建筑上的锁头 —— GLSL 绘制的全息挂锁 + 悬停时浮出的开放条件。
// ★ 是叠在建筑 SVG 之上的 HTML 层(着色器画布进不了 SVG), 自身不接收指针: 悬停/点击仍由
//   下面的建筑剪影命中区处理, 再把状态(hovered / denying)传进来。

import { PADLOCK_GEOMETRY, PADLOCK_PROGRAM, PADLOCK_UNIFORMS } from "@/ui/art/lock";
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
  /** 刚点过这栋楼: 锁头抖动变红, 条件牌同步闪一下。 */
  denying: boolean;
  seed: number;
}

export function BuildingLock({ building, reason, hovered, denying, seed }: BuildingLockProps) {
  return (
    <div
      className={cx(s.lock, (hovered || denying) && s.isShown, denying && s.isDenying)}
      style={{ left: building.lock.x, top: building.lock.y }}
      aria-hidden="true"
    >
      <GlslSprite
        className={s.sprite}
        program={PADLOCK_PROGRAM}
        width={PADLOCK_GEOMETRY.width}
        height={PADLOCK_GEOMETRY.height}
        uniforms={PADLOCK_UNIFORMS}
        active={denying}
        seed={seed}
      />
      <div className={s.plate}>
        <span className={s.state}>未开放</span>
        <span className={s.reason}>{reason}</span>
      </div>
    </div>
  );
}
