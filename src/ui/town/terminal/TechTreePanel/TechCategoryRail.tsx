import {
  TECH_BRANCHES,
  TECH_NODES,
  type TechCategoryDef,
  type TechTreeState,
} from "@/data";
import { techLevel } from "@/data";
import { cx } from "@/ui/common/cx";
import s from "./TechCategoryRail.module.css";

interface Props {
  categories: TechCategoryDef[];
  levels: TechTreeState["levels"];
  selectedId: string;
  onSelect: (categoryId: string) => void;
}

export function TechCategoryRail({ categories, levels, selectedId, onSelect }: Props) {
  return (
    <nav className={s.rail} aria-label="科技分类">
      <div className={s.railHead}>
        <span className={s.kicker}>研究目录</span>
        <h3>科技分类</h3>
      </div>
      <div className={s.categoryList}>
        {categories.map((category, index) => {
          const branches = TECH_BRANCHES.filter((branch) => branch.categoryId === category.id);
          const invested = branches.reduce(
            (sum, branch) =>
              sum + TECH_NODES.filter((node) => node.branchId === branch.id)
                .reduce((branchSum, node) => branchSum + techLevel(levels, node.id), 0),
            0,
          );
          const active = category.id === selectedId;
          return (
            <button
              key={category.id}
              className={cx(s.category, active && s["is-selected"])}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(category.id)}
            >
              <span className={s.index}>0{index + 1}</span>
              <span className={s.categoryCopy}>
                <strong>{category.name}</strong>
                <span>{category.desc}</span>
              </span>
              <span className={s.level}>已投入 Lv.{invested}</span>
              <span className={s.branchList}>
                {branches.map((branch) => <span key={branch.id}>{branch.name}</span>)}
              </span>
            </button>
          );
        })}
      </div>
      <p className={s.note}>选择分类后，在中央节点图中投入水晶与居民积分。</p>
    </nav>
  );
}
