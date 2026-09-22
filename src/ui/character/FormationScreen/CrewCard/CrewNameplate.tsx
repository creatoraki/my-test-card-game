// 编队卡名牌: 职业徽记 + 中文名 + 英文职业名, 叠在卡面底部动作条之上。
// ⚠ 中文名的字号与离底距离是飞行层的起落点(FormationScreen 的 CARD_FONT / CARD_NAME_BOTTOM),
//   改这里的 .name 要一并改那两个常量, 否则点卡起飞时名字会跳一下。

import { cx } from "@/ui/common/cx";
import { CrewClassGlyph } from "./CrewClassGlyph";
import { crewEnName } from "./crewCardDecor";
import s from "./CrewNameplate.module.css";

interface Props {
  charId: string;
  name: string;
  onField: boolean;
}

export function CrewNameplate({ charId, name, onField }: Props) {
  return (
    <span className={cx(s.plate, onField && s["is-on"])}>
      <CrewClassGlyph charId={charId} className={s.glyph} />
      <span className={s.name}>{name}</span>
      <span className={s.en}>{crewEnName(charId)}</span>
    </span>
  );
}
