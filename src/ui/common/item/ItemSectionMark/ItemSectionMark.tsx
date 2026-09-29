// 背包格的分区标记 —— 底边分区色条 + 分区首格的分类标签与格间竖分割线。
//
// 放在格子包裹层(position: relative)里, 与 ItemSlot 同级。网格用 --item-section-gap
// 告诉本组件自己的列间距, 竖线才能正好落在两格之间的缝里。
// 分区首格正好在行首时不画竖线(左边没有邻格), 只留标签。

import type { CSSProperties } from "react";
import { SECTION_COLOR, SECTION_LABEL, type SectionMark } from "@/ui/common/item/shared/itemSections";
import s from "./ItemSectionMark.module.css";

interface Props {
  mark: SectionMark;
  /** 本格是否位于一行的第一列。 */
  rowStart: boolean;
}

export function ItemSectionMark({ mark, rowStart }: Props) {
  const style = { "--item-section-color": SECTION_COLOR[mark.section] } as CSSProperties;
  return (
    <>
      <span className={s.strip} style={style} aria-hidden="true" />
      {mark.start && !rowStart && <span className={s.divider} style={style} aria-hidden="true" />}
      {mark.start && (
        <span className={s.tag} style={style}>
          {SECTION_LABEL[mark.section]}
        </span>
      )}
    </>
  );
}
