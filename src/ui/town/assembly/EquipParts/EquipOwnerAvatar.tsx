// 装备格右上角的穿戴者小头像：圆形窗口内对立绘做头部取景。

import { getCharacter } from "@/data";
import { CharacterPortrait } from "@/ui/common/unit/CharacterPortrait";
import s from "./EquipOwnerAvatar.module.css";

export function EquipOwnerAvatar({ charId }: { charId: string }) {
  const character = getCharacter(charId);
  return (
    <span className={s.avatar} aria-hidden="true">
      <CharacterPortrait characterId={charId} emoji={character.emoji} alt="" className={s.face} />
    </span>
  );
}
