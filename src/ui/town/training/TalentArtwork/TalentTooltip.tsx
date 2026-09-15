import type { CSSProperties } from "react";
import type { TalentNodeDef } from "@/data";
import type { Point } from "../TalentTreeRadial/talentGeometry";
import { NODE_STATUS, type TalentNodeState } from "./TalentNode";
import s from "./TalentTooltip.module.css";

export function TalentTooltip({ node, point, state, resourceLabel, reach, hue, locked }: {
  node: TalentNodeDef; point: Point; state: TalentNodeState; resourceLabel: string;
  reach: number; hue: string; locked: boolean;
}) {
  const below = point.y < 350;
  return (
    <aside role="tooltip" className={s.tip} data-below={below || undefined}
      style={{ left: Math.max(190, Math.min(1480, point.x)), top: point.y,
        "--tip-hue": hue } as CSSProperties}>
      <strong>{resourceLabel} · 第{Number(node.id.split("-").slice(-1)[0])}级</strong>
      <span className={s.effect}>{resourceLabel} +{node.value}</span>
      <span>消耗 {node.cost} 训练点</span>
      <span>{locked ? "远征中无法调整天赋" : NODE_STATUS[state]}</span>
      {!locked && state !== "active" && state !== "refundable" && <span>点亮到此还需 {reach} 点</span>}
      {!locked && <small>左键点亮 · 右键退还<br />按住换挡键点击可点亮整条路径</small>}
    </aside>
  );
}
