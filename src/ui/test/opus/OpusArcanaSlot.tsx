// ★ 塔罗图标的「容器层」★ —— 把一枚 OpusArcanaIcon 装进带名称与等级角标的槽位里。
//
// 分层继续保持死板: 这个文件只负责「槽位外壳 + 名称条 + 等级角标」的装配,
// 图标本体一律走 <OpusArcanaIcon>, 线稿则在 opusArcanaArt.tsx —— 三层互不越界。
//
// 用法:
//   <OpusArcanaSlot id="tower" level={5} />              激活态槽位, 右上角等级 5
//   <OpusArcanaSlot id="tower" level={5} inactive />     未激活槽位(图标与外壳一起去色)
//   <OpusArcanaSlot id="tower" level={5} onClick={...} /> 可点
import type { CSSProperties } from "react";
import { cx } from "@/ui/common/cx";
import { OpusArcanaIcon } from "./OpusArcanaIcon";
import { OPUS_ARCANA_BY_ID, type OpusArcanaId } from "./opusArcanaArt";
import s from "./OpusArcanaSlot.module.css";

export interface OpusArcanaSlotProps {
  id: OpusArcanaId;
  /** 当前等级, 显示在右上角的角标里。 */
  level: number;
  /** 内部图标的边长(px)。槽位的边框 / 字号 / 角标全部由它派生。 */
  iconSize?: number;
  /** 未激活态: 图标与槽位外壳一起去色压暗。 */
  inactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function OpusArcanaSlot({
  id,
  level,
  iconSize = 72,
  inactive = false,
  onClick,
  className,
}: OpusArcanaSlotProps) {
  const meta = OPUS_ARCANA_BY_ID[id];
  const style = {
    "--slot-icon": `${iconSize}px`,
    "--slot-accent": meta.accent,
  } as CSSProperties;

  const body = (
    <>
      <div className={s.frame}>
        <OpusArcanaIcon id={id} size={iconSize} chrome={false} inactive={inactive} />
        <span className={s.level} aria-hidden="true">{level}</span>
      </div>
      <span className={s.name}>{meta.name}</span>
    </>
  );

  const shellClass = cx(s.slot, onClick && s.interactive, className);
  const label = `${meta.name} 等级 ${level}${inactive ? " 未激活" : ""}`;

  if (onClick) {
    return (
      <button
        type="button"
        className={shellClass}
        style={style}
        data-inactive={inactive}
        aria-label={label}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={shellClass} style={style} data-inactive={inactive} aria-label={label}>
      {body}
    </div>
  );
}
