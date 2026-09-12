import { cx } from "@/ui/common/cx";
import { TechnologyMedallion } from "@/ui/common/techTree/TechnologyMedallion";
import { TECHNOLOGY_STATE_LABEL, type TechnologyCore, type TechnologyNode } from "@/ui/common/techTree/TechnologyTree/types";
import { technologyGraphEdges } from "./technologyGraphGeometry";
import s from "./TechnologyGraph.module.css";

interface Props {
  nodes: TechnologyNode[];
  core: TechnologyCore;
  canvas: { width: number; height: number };
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function TechnologyGraph({ nodes, core, canvas, selectedId, onSelect, className }: Props) {
  return (
    <section className={cx(s.viewport, className)} aria-label="设施科技路线">
      <div className={s.canvas} style={{ width: canvas.width, height: canvas.height }}>
        <svg className={s.connections} width={canvas.width} height={canvas.height} aria-hidden="true">
          {technologyGraphEdges(nodes, core).map((edge) => <g key={edge.id} className={s.edge} data-lit={edge.lit || undefined}>
            <path className={s.halo} d={edge.path} />
            <path className={s.wire} d={edge.path} />
            <circle cx={edge.start.x} cy={edge.start.y} r="7" />
            <circle cx={edge.end.x} cy={edge.end.y} r="7" />
          </g>)}
        </svg>
        <div className={s.core} style={{ left: core.x, top: core.y }}>
          <TechnologyMedallion icon={core.icon} />
          <strong className={s.name}>{core.name}</strong>
          <span className={s.coreStatus}>已解锁</span>
        </div>
        {nodes.map((node) => <button
          key={node.id}
          className={s.node}
          style={{ left: node.x, top: node.y }}
          type="button"
          data-state={node.state}
          data-selected={selectedId === node.id || undefined}
          aria-label={`${node.name}，${TECHNOLOGY_STATE_LABEL[node.state]}`}
          aria-pressed={selectedId === node.id}
          onClick={() => onSelect(node.id)}
        >
          <TechnologyMedallion icon={node.icon} state={node.state} selected={selectedId === node.id} />
          <strong className={s.name}>{node.name}</strong>
          <span className={s.status}>{TECHNOLOGY_STATE_LABEL[node.state]}</span>
        </button>)}
      </div>
    </section>
  );
}
