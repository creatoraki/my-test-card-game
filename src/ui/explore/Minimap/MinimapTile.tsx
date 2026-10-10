// 单个房间方块 —— 霓虹描边 + 四角括号 + 深色内面板 + 居中图标, 序号浮在方块正上方。
// 尺寸由 --tile 决定, 配色由 data-tone 决定; HUD 缩略图、展开大图、图例三处共用。

import type { CSSProperties, ReactNode } from "react";
import { MinimapIcon } from "./MinimapIcons";
import type { MapIcon, MapTone } from "./minimapModel";
import s from "./MinimapTile.module.css";

export interface MinimapTileProps {
  tone: MapTone;
  icon: MapIcon;
  size: number;
  label?: ReactNode;
  dim?: boolean;
  /** 房间里的月光传送盆标记。 */
  waystone?: "lit" | "dark";
  target?: boolean;
  picking?: boolean;
  left?: number;
  top?: number;
  ariaLabel?: string;
  onClick?: () => void;
}

export function MinimapTile({
  tone, icon, size, label, dim, waystone, target, picking, left, top, ariaLabel, onClick,
}: MinimapTileProps) {
  const style = {
    "--tile": `${size}px`,
    ...(left === undefined ? null : { position: "absolute", left, top }),
  } as CSSProperties;
  const props = {
    className: s.tile,
    style,
    "data-tone": tone,
    "data-dim": dim || undefined,
    "data-target": target || undefined,
    "data-picking": picking || undefined,
    "aria-label": ariaLabel,
  };
  const body = <>
    {label !== undefined && <span className={s.num} aria-hidden>{label}</span>}
    <span className={s.shell}>
      <span className={s.face}>
        <MinimapIcon icon={icon} className={s.icon} />
      </span>
    </span>
    <i className={s.corners} aria-hidden />
    {tone === "current" && <i className={s.halo} aria-hidden />}
    {waystone && <i className={s.waystone} data-lit={waystone === "lit" || undefined} aria-hidden />}
  </>;
  return onClick
    ? <button {...props} type="button" onClick={onClick}>{body}</button>
    : <div {...props}>{body}</div>;
}

export default MinimapTile;
