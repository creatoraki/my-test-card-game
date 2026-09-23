import { useId, type KeyboardEvent, type MouseEvent } from "react";
import { cx } from "@/ui/common/shared/cx";
import { TrackIcon } from "../TalentTreeRadial/icons";
import type { Point } from "../TalentTreeRadial/talentGeometry";
import s from "./TalentNode.module.css";

export type TalentNodeState = "locked" | "available" | "unaffordable" | "active" | "refundable";
export const NODE_STATUS: Record<TalentNodeState, string> = {
  locked: "前置节点尚未点亮", available: "点击点亮", unaffordable: "训练点不足",
  active: "已激活，后续节点依赖此天赋", refundable: "已激活，可右键退还",
};
interface Props {
  point: Point; radius: number; branchId: string; state: TalentNodeState;
  locked: boolean; latest: boolean; shaking: boolean; label: string;
  onClick: (event: MouseEvent<SVGGElement>) => void;
  onContextMenu: (event: MouseEvent<SVGGElement>) => void;
  onKeyDown: (event: KeyboardEvent<SVGGElement>) => void;
  onEnter: () => void; onLeave: () => void;
}
export function TalentNode({ point, radius, branchId, state, locked, latest, shaking, label,
  onClick, onContextMenu, onKeyDown, onEnter, onLeave }: Props) {
  const id = useId();
  const active = state === "active" || state === "refundable";
  const size = radius * 1.38;
  return (
    <g className={cx(s.node, latest && s.latest, shaking && s.shaking)}
      transform={`translate(${point.x} ${point.y})`} data-state={state}
      data-readonly={locked || undefined} role="button" tabIndex={locked ? -1 : 0}
      aria-disabled={locked || (!active && state !== "available")} aria-label={label}
      onClick={onClick} onContextMenu={onContextMenu} onKeyDown={onKeyDown}
      onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={onEnter} onBlur={onLeave}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#fff4d8" /><stop offset=".2" stopColor="#8a919a" />
          <stop offset=".52" stopColor="#343e49" /><stop offset=".8" stopColor="#a1a5ab" /><stop offset="1" stopColor="#e5e7e7" />
        </linearGradient>
        <radialGradient id={id + "-face"} cx=".35" cy=".18" r=".85">
          <stop stopColor="#3b444e" /><stop offset=".45" stopColor="#18222d" /><stop offset="1" stopColor="#080e17" />
        </radialGradient>
      </defs>
      <g className={s.visual}>
        <circle className={s.halo} r={radius + 2} />
        <circle r={radius} fill={`url(#${id}-face)`} stroke={`url(#${id})`} strokeWidth="2.7" />
        <circle className={s.rim} r={radius - 2} />
        <circle className={s.inner} r={radius - 5} />
        <path d={`M ${-radius * .65} ${-radius * .55} A ${radius * .85} ${radius * .85} 0 0 1 ${radius * .5} ${-radius * .69}`}
          stroke="#e7edee" strokeOpacity=".5" strokeWidth=".7" fill="none" />
        <g className={s.icon} transform={`translate(${-size / 2} ${-size / 2}) scale(${size / 48})`}>
          <TrackIcon branchId={branchId} />
        </g>
        {active && <path className={s.spark} d={`M0 ${-radius - 15} 2 ${-radius - 8} 7 ${-radius - 6} 2 ${-radius - 4} 0 ${-radius + 1} -2 ${-radius - 4} -7 ${-radius - 6} -2 ${-radius - 8}Z`} />}
        {state === "refundable" && <circle className={s.refund} r={radius + 5} />}
      </g>
    </g>
  );
}
