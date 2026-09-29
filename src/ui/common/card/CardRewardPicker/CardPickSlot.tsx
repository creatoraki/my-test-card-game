// 三选一的单个候选格: 归属角色行 + 原尺寸卡面 + L 型四角提示框。
// 悬停/聚焦只上报给父级(用于右侧详情), 点击只「选中」, 真正的领取由父级的确认按钮完成。
import { memo, type CSSProperties } from "react";
import { getCharacter } from "@/data";
import { playSfx } from "@/ui/audio";
import { HandCard } from "@/ui/common/card/HandCard";
import { InteractiveHint } from "@/ui/common/tooltip/InteractiveHint";
import type { CardPickOption } from "./types";
import s from "./CardPickSlot.module.css";

interface Props {
  option: CardPickOption;
  index: number;
  selected: boolean;
  /** 父级记录的悬停/聚焦候选: 整格(含角色行与底部标签)悬停都点亮四角框, 不只卡面。 */
  hovered: boolean;
  /** 已有别的候选被选中: 本格轻微压暗, 悬停时恢复。 */
  dimmed: boolean;
  onSelect: (key: string) => void;
  onHover: (key: string | null) => void;
}

export const CardPickSlot = memo(function CardPickSlot({ option, index, selected, hovered, dimmed, onSelect, onHover }: Props) {
  const { card } = option;
  const owner = getCharacter(option.ownerCharId ?? card.ownerCharId);
  const select = () => {
    if (!selected) playSfx("cardSelect");
    onSelect(option.key);
  };

  return (
    <div
      className={s.slot}
      data-selected={selected ? "" : undefined}
      data-dimmed={dimmed ? "" : undefined}
      data-sfx="off"
      style={{ "--pick-delay": `${120 + index * 90}ms`, "--owner-color": owner.color } as CSSProperties}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`选择 ${owner.name} 的卡牌 ${card.name}`}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select();
      }}
      onMouseEnter={() => {
        playSfx("cardHover");
        onHover(option.key);
      }}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(option.key)}
      onBlur={() => onHover(null)}
    >
      <div className={s.owner}>
        <span className={s.ownerMark} aria-hidden="true" />
        <span className={s.ownerName}>{owner.name}</span>
      </div>
      {/* 四角框宿主只包卡面, 框线贴着卡边; 显隐由 active 驱动(见上方 hovered 注释)。 */}
      <div className={s.cardBox} data-interactive-hint="">
        <HandCard card={card} variant="pile" playable selected={false} />
        <InteractiveHint active={selected || hovered} />
      </div>
      <span className={s.state}>{selected ? "已选择" : "点击选择"}</span>
    </div>
  );
});
