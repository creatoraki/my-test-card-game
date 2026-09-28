// 卡牌图鉴的角色页签：每名角色一页，横向排列，页签上标注该角色的收录进度。

import type { CSSProperties } from "react";
import { cx } from "@/ui/common/shared/cx";
import type { CardGroup } from "../shared/codexCatalog";
import s from "./CardOwnerTabs.module.css";

interface Props {
  groups: CardGroup[];
  recorded: string[];
  value: string;
  onChange: (id: string) => void;
}

export function CardOwnerTabs({ groups, recorded, value, onChange }: Props) {
  return (
    <div className={s["tabs"]} role="tablist" aria-label="按角色浏览卡牌">
      {groups.map((group) => {
        const unlocked = group.cards.filter((card) => recorded.includes(card.id)).length;
        const active = group.id === value;
        return (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cx(s["tab"], active && s["is-on"])}
            style={{ "--owner-color": group.color } as CSSProperties}
            onClick={() => onChange(group.id)}
          >
            <span className={s["name"]}>{group.name}</span>
            <span className={s["count"]}>{unlocked}/{group.cards.length}</span>
          </button>
        );
      })}
    </div>
  );
}
