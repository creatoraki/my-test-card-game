import { cx } from "@/ui/common/cx";
import { TechnologyMaterials } from "@/ui/common/techTree/TechnologyMaterials";
import { TechnologyMedallion } from "@/ui/common/techTree/TechnologyMedallion";
import { TECHNOLOGY_STATE_LABEL, type TechnologyNode } from "@/ui/common/techTree/TechnologyTree/types";
import s from "./TechnologyDetail.module.css";

export function TechnologyDetail({ node, className }: { node: TechnologyNode | null; className?: string }) {
  return (
    <aside className={cx(s.detail, className)} aria-label={node ? `${node.name}详情` : "科技节点详情"}>
      {node ? <>
        <div className={s.intro}>
          <TechnologyMedallion className={s.portrait} icon={node.icon} state={node.state} detail />
          <div className={s.information}>
            <h3 className={s.name}>{node.name}</h3>
            <div className={s.tags}><span className={s.category}>{node.category}</span><span className={s.tag}>设施科技</span></div>
            <p className={s.prerequisite}>需先解锁：<strong>{node.prerequisite}</strong></p>
            <p className={s.description}>{node.description}</p>
          </div>
        </div>
        <h4 className={s.sectionTitle}>消耗材料</h4>
        <TechnologyMaterials materials={node.materials} done={node.state === "done"} />
        <h4 className={s.sectionTitle}>节点效果</h4>
        <ul className={s.effects}>
          {node.effects.map((effect, index) => <li key={`${index}-${effect.label}`}>
            <span className={s.effectIcon} aria-hidden="true">{effect.symbol ?? "↑"}</span>
            <span>{effect.label} {effect.value && <strong>{effect.value}</strong>}</span>
          </li>)}
        </ul>
        <div className={s.status} data-state={node.state} role="status">
          <span className={s.statusMark} aria-hidden="true">{node.state === "done" ? "✓" : "◇"}</span>
          <div><strong>{TECHNOLOGY_STATE_LABEL[node.state]}</strong><p>{statusDescription(node)}</p></div>
        </div>
      </> : <p className={s.empty}>选择左侧科技节点，查看升级效果与消耗材料。</p>}
    </aside>
  );
}

function statusDescription(node: TechnologyNode) {
  switch (node.state) {
    case "done": return "设施升级已完成，节点效果已生效。";
    case "available": return "材料已备齐，可以解锁此节点。";
    case "lacking": return "仓库材料不足，补齐材料后即可解锁。";
    case "locked": return `完成「${node.prerequisite}」后开放此节点。`;
  }
}
