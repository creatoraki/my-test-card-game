// 卡组面板的角色页签行: 职业徽记 + 角色名, 激活态翠绿; 右端是卡组计数。
// 目标已锁定(或只有一名角色)时只显示一枚激活页签「某某的卡组」, 不可切换。
// 页签底板为可选素材(三段拉伸), 未放入时走 CSS 兜底。
import type { CSSProperties } from "react";
import { DECK_SERVICE_ART } from "@/ui/art/explore/deckServiceArt";
import { CrewClassGlyph } from "@/ui/character/glyphs/CrewClassGlyph";
import { cx } from "@/ui/common/shared/cx";
import { TABS, rectStyle } from "./deckGeometry";
import s from "./DeckTabs.module.css";

export interface DeckTabMember {
  charId: string;
  name: string;
}

interface Props {
  members: DeckTabMember[];
  activeId: string | null;
  /** false = 只显示当前角色的单页签。 */
  pickable: boolean;
  count: string;
  onPick: (charId: string) => void;
}

const ART_VARS = {
  ...(DECK_SERVICE_ART.tab ? { "--tab-art": `url("${DECK_SERVICE_ART.tab}")` } : {}),
  ...(DECK_SERVICE_ART.tabActive ? { "--tab-art-active": `url("${DECK_SERVICE_ART.tabActive}")` } : {}),
} as CSSProperties;

export function DeckTabs({ members, activeId, pickable, count, onPick }: Props) {
  const active = members.find((member) => member.charId === activeId);
  const shown = pickable ? members : active ? [active] : [];
  return (
    <div className={s.row} style={{ ...rectStyle(TABS), ...ART_VARS }} data-art={DECK_SERVICE_ART.tab ? "" : undefined}>
      <div className={s.tabs} role="tablist" aria-label="选择角色">
        {shown.map((member) => {
          const on = member.charId === activeId;
          return (
            <button
              key={member.charId}
              type="button"
              role="tab"
              aria-selected={on}
              className={cx(s.tab, on && s.active)}
              disabled={!pickable}
              onClick={() => !on && onPick(member.charId)}
            >
              <CrewClassGlyph charId={member.charId} className={s.glyph} />
              <span>{pickable ? member.name : `${member.name}的卡组`}</span>
            </button>
          );
        })}
      </div>
      <span className={s.count}>{count}</span>
    </div>
  );
}
