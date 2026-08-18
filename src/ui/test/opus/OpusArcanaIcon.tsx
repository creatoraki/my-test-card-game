// ★ 塔罗题材图标 ★ —— 六张大阿卡纳题材的 1:1 美术图标(纯 SVG + CSS, 无位图依赖)。
//
// 画风对齐事件面板的插图占位区: 深青底、内缩断角框、透视网格、主色光晕、档案角标。
// 分层很死: 这个文件只管「外壳 + 装配」, 图案线稿全在 opusArcanaArt.tsx, 二者互不越界。
//
// 用法:
//   <OpusArcanaIcon id="tower" size={256} />           素材尺寸, 带全套角标
//   <OpusArcanaIcon id="tower" size={40} chrome={false} />  UI 尺寸, 只留图案
//   <OpusArcanaIcon id="tower" onClick={...} />        可点(自动带 hover / 焦点态)
//   <OpusArcanaIcon id="tower" inactive />             未激活态(去色压暗, 造型不变)
import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import { OPUS_ARCANA_BY_ID, type OpusArcanaId } from "./opusArcanaArt";
import s from "./OpusArcanaIcon.module.css";

export interface OpusArcanaIconProps {
  id: OpusArcanaId;
  /** 边长(px)。图标严格 1:1, 内部一切尺寸由它派生。 */
  size?: number;
  /** 是否显示断角内框与档案角标 —— 小尺寸建议关掉, 只留图案。 */
  chrome?: boolean;
  /** 未激活态: 整体去色压暗(线稿 / 光晕 / 边框一起), 造型与尺寸完全不变。 */
  inactive?: boolean;
  selected?: boolean;
  onClick?: () => void;
  /** 覆盖题材主色, 不传则用题材自带的色。 */
  accent?: string;
  className?: string;
}

export function OpusArcanaIcon({
  id,
  size = 256,
  chrome = true,
  inactive = false,
  selected = false,
  onClick,
  accent,
  className,
}: OpusArcanaIconProps) {
  const meta = OPUS_ARCANA_BY_ID[id];
  const style = {
    "--icon-size": `${size}px`,
    "--arcana-accent": accent ?? meta.accent,
  } as CSSProperties;

  const inner: ReactNode = (
    <>
      <div className={s.grid} />
      <div className={s.halo} />
      {chrome && <div className={s.numeral} aria-hidden="true">{meta.numeral}</div>}
      <svg className={s.art} viewBox="0 0 100 100" aria-hidden="true">
        {meta.art}
      </svg>
      {chrome && (
        <div className={s.tag}>
          <span>{meta.code}</span>
          <span>ARCANA<br />ARCHIVE</span>
        </div>
      )}
      {chrome && (
        <div className={s.caption}>
          <span>{meta.latin}</span>
          <strong>{meta.name}</strong>
        </div>
      )}
    </>
  );

  const shellClass = cx(
    s.icon,
    onClick && s.interactive,
    selected && s.selected,
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={shellClass}
        style={style}
        data-chrome={chrome}
        data-inactive={inactive}
        aria-label={`${meta.name} ${meta.latin}`}
        aria-pressed={selected}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={shellClass}
      style={style}
      data-chrome={chrome}
      data-inactive={inactive}
      role="img"
      aria-label={`${meta.name} ${meta.latin}`}
    >
      {inner}
    </div>
  );
}
