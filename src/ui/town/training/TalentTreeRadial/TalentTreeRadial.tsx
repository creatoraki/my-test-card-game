// 原型星盘表现编排；激活、前置依赖、退还与快捷点亮仍走数据层判定。
import { useEffect, useId, useMemo, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { canRefund, costToReach, isUnlocked, pathTo, type SquadBadgeDef, type SquadResourceKey, type TalentNodeDef } from "@/data";
import { cx } from "@/ui/common/cx";
import { TalentEmblem } from "../TalentArtwork/TalentEmblem";
import { TalentPlaque } from "../TalentArtwork/TalentPlaque";
import { TalentNode, NODE_STATUS, type TalentNodeState } from "../TalentArtwork/TalentNode";
import { TalentTooltip } from "../TalentArtwork/TalentTooltip";
import { RADIAL_CENTER, branchArtOf, buildRadialLayout, nodeRadius, type Point } from "./talentGeometry";
import s from "./TalentTreeRadial.module.css";

interface Props {
  badge: SquadBadgeDef;
  activated: string[];
  remaining: number;
  locked: boolean;
  resourceLabels: Record<SquadResourceKey, string>;
  pulse: { nodeId: string; n: number } | null;
  shakeId: string | null;
  onRequestShake: (id: string) => void;
  onActivate: (id: string) => void;
  onQuickBuy: (id: string) => void;
  onRefund: (id: string) => void;
  onHoverKey?: (key: SquadResourceKey | null) => void;
  onCoreClick?: () => void;
  className?: string;
}
export function TalentTreeRadial({ badge, activated, remaining, locked, resourceLabels,
  pulse, shakeId, onRequestShake, onActivate, onQuickBuy, onRefund, onHoverKey, onCoreClick, className }: Props) {
  const id = useId();
  const layout = useMemo(() => buildRadialLayout(badge), [badge]);
  const active = useMemo(() => new Set(activated), [activated]);
  const [hover, setHover] = useState<{ node: TalentNodeDef; point: Point; branchId: string } | null>(null);
  const [coreHovered, setCoreHovered] = useState(false);
  const trace = useMemo(() => new Set(hover ? pathTo(badge, hover.node.id).map(node => node.id) : []), [badge, hover]);
  useEffect(() => () => onHoverKey?.(null), [onHoverKey]);
  function stateOf(node: TalentNodeDef): TalentNodeState {
    if (active.has(node.id)) return canRefund(badge, activated, node.id) ? "refundable" : "active";
    if (!isUnlocked(activated, node)) return "locked";
    return remaining >= node.cost ? "available" : "unaffordable";
  }
  function clearHover() { setHover(null); onHoverKey?.(null); }
  function press(node: TalentNodeDef, event: { altKey: boolean; shiftKey: boolean }) {
    if (locked) return;
    const state = stateOf(node);
    if (state === "refundable" && event.altKey) { onRefund(node.id); return; }
    if (state === "active" || state === "refundable") return;
    if (event.shiftKey) {
      if (costToReach(badge, activated, node.id) <= remaining) onQuickBuy(node.id);
      else onRequestShake(node.id);
    } else if (state === "available") onActivate(node.id);
    else if (state === "unaffordable") onRequestShake(node.id);
  }
  function refund(node: TalentNodeDef, event: MouseEvent<SVGGElement>) {
    event.preventDefault();
    if (locked) return;
    const state = stateOf(node);
    if (state === "refundable") onRefund(node.id);
    else if (state === "active") onRequestShake(node.id);
  }
  function keyDown(node: TalentNodeDef, event: KeyboardEvent<SVGGElement>) {
    if (locked) return;
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); press(node, event); }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      const state = stateOf(node);
      if (state === "refundable") onRefund(node.id);
      else if (state === "active") onRequestShake(node.id);
    }
  }
  return (
    <section className={cx(s.tree, className)} aria-label="天赋树" data-tracing={hover ? "" : undefined}>
      <svg className={s.svg} viewBox="0 0 1672 941" onContextMenu={event => event.preventDefault()}>
        <defs>
          <filter id={id + "-glow"} filterUnits="userSpaceOnUse" x="380" y="90" width="920" height="590">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        {layout.map(branch => {
          const def = badge.branches[branch.branchIndex];
          const art = branchArtOf(def.id);
          const traced = branch.nodes.some(node => trace.has(node.id));
          return (
            <g key={def.id} className={s.branch} data-traced={traced || undefined}
              style={{ "--trr-hue": art.hue, "--trr-deep": art.deep } as CSSProperties}>
              <g aria-hidden="true">
                <path className={s.lineGlow} d={branch.pathD} filter={`url(#${id}-glow)`} />
                <path className={s.line} d={branch.pathD} />
                <path className={s.lineCore} d={branch.pathD} />
                {branch.nodes.some(node => active.has(node.id)) && <circle r="2.2" fill="#fff4d6">
                  <animateMotion dur="5s" repeatCount="indefinite" path={branch.pathD} />
                </circle>}
                <g transform={`translate(${branch.labelPoint.x} ${branch.labelPoint.y})`}>
                  <TalentPlaque branchId={def.id} name={def.name}
                    count={branch.nodes.filter(node => active.has(node.id)).length} total={branch.nodes.length} />
                </g>
              </g>
              {branch.nodes.map((node, index) => {
                const state = stateOf(node);
                const lit = state === "active" || state === "refundable";
                return <TalentNode key={`${node.id}-${lit && pulse?.nodeId === node.id ? pulse.n : "stable"}`}
                  point={branch.nodePoints[index]} radius={nodeRadius(node, index)} branchId={def.id}
                  state={state} locked={locked}
                  latest={lit && pulse?.nodeId === node.id} shaking={shakeId === node.id}
                  label={`${def.name}，第${index + 1}级，${resourceLabels[node.key]}增加${node.value}，消耗${node.cost}训练点。${NODE_STATUS[state]}`}
                  onClick={event => { event.preventDefault(); press(node, event); }}
                  onContextMenu={event => refund(node, event)} onKeyDown={event => keyDown(node, event)}
                  onEnter={() => { setHover({ node, point: branch.nodePoints[index], branchId: def.id }); onHoverKey?.(node.key); }}
                  onLeave={clearHover} />;
              })}
            </g>
          );
        })}
      </svg>
      <button type="button" className={s.core} aria-label="切换小队徽章"
        style={{ left: RADIAL_CENTER.x - 92, top: RADIAL_CENTER.y - 92 }}
        onClick={onCoreClick} onMouseEnter={() => setCoreHovered(true)} onMouseLeave={() => setCoreHovered(false)}
        onFocus={() => setCoreHovered(true)} onBlur={() => setCoreHovered(false)}>
        <TalentEmblem />
      </button>
      {coreHovered && <span className={s.coreTip} role="tooltip">切换小队徽章</span>}
      {hover && <TalentTooltip node={hover.node} point={hover.point} state={stateOf(hover.node)}
        resourceLabel={resourceLabels[hover.node.key]} reach={costToReach(badge, activated, hover.node.id)}
        hue={branchArtOf(hover.branchId).hue} locked={locked} />}
    </section>
  );
}
