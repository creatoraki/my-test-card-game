import type { CSSProperties } from "react";
import type { TalentNodeDef } from "@/data";
import { TooltipCard, type TooltipNote } from "@/ui/common/tooltip/TooltipCard";
import type { Point } from "../TalentTreeRadial/talentGeometry";
import { NODE_STATUS, type TalentNodeState } from "./TalentNode";
import s from "./TalentTooltip.module.css";

/** 天赋节点悬浮详情: 外层 aside 只管按节点坐标落位, 外观统一交给 TooltipCard(强调色取分支色)。 */
export function TalentTooltip({ node, point, state, resourceLabel, reach, hue, locked }: {
  node: TalentNodeDef; point: Point; state: TalentNodeState; resourceLabel: string;
  reach: number; hue: string; locked: boolean;
}) {
  const below = point.y < 350;
  const level = Number(node.id.split("-").slice(-1)[0]);
  const notes: TooltipNote[] = [
    { text: locked ? "远征中无法调整天赋" : NODE_STATUS[state], tone: locked ? "bad" : "accent" },
  ];
  if (!locked && state !== "active" && state !== "refundable") notes.push({ text: `点亮到此还需 ${reach} 点`, tone: "muted" });
  if (!locked) {
    notes.push({ text: "左键点亮 · 右键退还", tone: "muted" });
    notes.push({ text: "按住换挡键点击可点亮整条路径", tone: "muted" });
  }
  return (
    <aside role="tooltip" className={s.tip} data-below={below || undefined}
      style={{ left: Math.max(190, Math.min(1480, point.x)), top: point.y } as CSSProperties}>
      <TooltipCard
        title={`${resourceLabel} · 第${level}级`}
        desc={`${resourceLabel} +${node.value}，消耗 ${node.cost} 训练点`}
        notes={notes}
        accent={hue}
      />
    </aside>
  );
}
