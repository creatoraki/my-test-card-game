// 三选一的单个候选格: 归属行(职业徽记 + 角色名) + 放大卡面 + 钢框叠加 + 紫色霓虹选中框。
// 悬停/聚焦只上报给父级(用于侧边词条释义与连接线), 点击只「选中」, 真正的领取由父级的确认按钮完成。
import { memo, type CSSProperties } from "react";
import { getCharacter } from "@/data";
import { playSfx } from "@/ui/audio";
import { CrewClassGlyph } from "@/ui/character/glyphs/CrewClassGlyph";
import { HandCard } from "@/ui/common/card/HandCard";
import { PickCardRim } from "./parts/PickCardRim";
import { PickSelectFrame } from "./parts/PickSelectFrame";
import type { CardPickOption } from "./types";
import s from "./CardPickSlot.module.css";

interface Props {
  option: CardPickOption;
  index: number;
  selected: boolean;
  /** 父级记录的悬停/聚焦候选: 整格(含归属行)悬停都点亮选中框的悬停态, 不只卡面。 */
  hovered: boolean;
  /** 已有别的候选被选中: 本格轻微压暗, 悬停时恢复。 */
  dimmed: boolean;
  onSelect: (key: string) => void;
  onHover: (key: string | null) => void;
}

export const CardPickSlot = memo(function CardPickSlot({ option, index, selected, hovered, dimmed, onSelect, onHover }: Props) {
  const { card } = option;
  const ownerId = option.ownerCharId ?? card.ownerCharId;
  const owner = getCharacter(ownerId);
  const frameState = selected ? "selected" : hovered ? "hover" : null;
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
      style={{ "--pick-delay": `${220 + index * 90}ms`, "--owner-color": owner.color } as CSSProperties}
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
        <CrewClassGlyph charId={ownerId} className={s.ownerGlyph} />
        <span className={s.ownerName}>{owner.name}</span>
      </div>
      <div className={s.cardBox}>
        <HandCard card={card} variant="pile" playable selected={false} />
        <PickCardRim state={frameState} />
        <PickSelectFrame state={frameState} />
      </div>
    </div>
  );
});
