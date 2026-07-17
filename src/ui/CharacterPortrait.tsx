import swordsmanPortrait from "../assets/人物立绘/剑士-透明.png";

// 角色立绘登记表(与 enemyArt.ts 同思路: 静态 import + 登记表, 按 CharacterDef.id 作键)。
// 立绘只登记在 UI 层 —— data/characters.ts 不碰素材路径, 与 enemyArt.ts / battleBg.ts 同约定。
interface CharacterArtDef {
  src: string;
  // 战斗中半身取景的微调偏移(px, 正=右/下)。各角色原图里身体的水平位置、留白高低不一,
  // 靠它把人挪回槽位中央; 只影响战斗立绘, 菜单的 .menu-portrait 全身像不受影响。
  dx?: number;
  dy?: number;
  // ★ 底部头像栏(AllyBar)的头部取景微调, 与上面的半身取景是两套独立参数 —— 取景窗的
  // 尺寸与裁法都不同, 偏移量不通用, 故不复用 dx/dy。
  //   zoom: 图宽相对取景窗宽的倍率(1 = 图宽正好铺满槽宽), 调大 = 头更大、向两侧溢出
  //   dx/dy: 缩放后的位置微调(px, 正=右/下), 把头挪进取景窗
  head?: { zoom?: number; dx?: number; dy?: number };
}

const CHARACTER_ART: Record<string, CharacterArtDef> = {
  // 剑士: 原图人物偏左(左手持剑外展占了画面左侧), 右移 20px 才在槽位里居中
  swordsman: { src: swordsmanPortrait, dx: 10, head: { zoom: 1.15, dx: 4, dy: -12 } },
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
    // 两套取景各自下发自己的变量, 由 className 决定 styles.css 里哪套规则接管:
    //   无 className   → .combatant-figure .portrait-image  半身像(1:1 cover)
    //   avatar-portrait → .ally-avatar .portrait-image       头像栏的头部取景
    //   menu-portrait   → 基础规则 .portrait-image           全身(contain)
    return (
      <img
        className={`portrait-image ${className ?? ""}`}
        src={art.src}
        alt={alt}
        style={
          {
            "--portrait-dx": `${art.dx ?? 0}px`,
            "--portrait-dy": `${art.dy ?? 0}px`,
            "--head-zoom": `${art.head?.zoom ?? 1}`,
            "--head-dx": `${art.head?.dx ?? 0}px`,
            "--head-dy": `${art.head?.dy ?? 0}px`,
          } as React.CSSProperties
        }
      />
    );
  }

  // 未登记立绘的角色退回 emoji
  return <span className={`portrait ${className ?? ""}`}>{emoji}</span>;
}
