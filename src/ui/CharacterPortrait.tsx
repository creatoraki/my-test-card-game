import swordsmanPortrait from "../assets/人物立绘/剑士-透明.png";

// 角色立绘登记表(与 enemyArt.ts 同思路: 静态 import + 登记表, 按 CharacterDef.id 作键)。
interface CharacterArtDef {
  src: string;
  // 战斗中半身取景的微调偏移(px, 正=右/下)。各角色原图里身体的水平位置、留白高低不一,
  // 靠它把人挪回槽位中央; 只影响战斗立绘, 菜单的 .menu-portrait 全身像不受影响。
  dx?: number;
  dy?: number;
}

const CHARACTER_ART: Record<string, CharacterArtDef> = {
  // 剑士: 原图人物偏左(左手持剑外展占了画面左侧), 右移 20px 才在槽位里居中
  swordsman: { src: swordsmanPortrait, dx: 10 },
};

interface Props {
  characterId?: string;
  emoji: string;
  alt: string;
  className?: string;
}

export function CharacterPortrait({ characterId, emoji, alt, className }: Props) {
  const art = characterId ? CHARACTER_ART[characterId] : undefined;

  if (art) {
    return (
      <img
        className={`portrait-image ${className ?? ""}`}
        src={art.src}
        alt={alt}
        style={
          {
            "--portrait-dx": `${art.dx ?? 0}px`,
            "--portrait-dy": `${art.dy ?? 0}px`,
          } as React.CSSProperties
        }
      />
    );
  }

  // 未登记立绘的角色退回 emoji
  return <span className={`portrait ${className ?? ""}`}>{emoji}</span>;
}
