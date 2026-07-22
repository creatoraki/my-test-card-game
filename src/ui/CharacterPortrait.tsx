import swordsmanPortrait from "../assets/人物立绘/剑士-透明.png";

// 角色立绘登记表(与 enemyArt.ts 同思路: 静态 import + 登记表, 按 CharacterDef.id 作键)。
// 立绘只登记在 UI 层 —— data/characters.ts 不碰素材路径, 与 enemyArt.ts / battleBg.ts 同约定。
interface CharacterArtDef {
  src: string;
  // 半身取景的微调偏移(px, 正=右/下)。各角色原图里身体的水平位置、留白高低不一,
  // 靠它把人挪回槽位中央。三套半身取景(战斗立绘 / 队伍卡 / 当前角色大卡)共用这一对参数,
  // 菜单的 .menu-portrait 全身像不受影响。
  dx?: number;
  dy?: number;
  // 头部取景的微调参数(zoom = 图宽相对取景窗宽的倍率; dx/dy = 缩放后的位置微调)。
  // ⚠ 目前**没有使用方** —— 底部队伍卡已从「头部裁切的玻璃头像」改为「带框半身立绘」,
  // 半身走上面的 dx/dy。这套参数保留登记, 留给后续需要圆头像的界面(如编队/结算页)。
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
    // 各套取景各自下发自己的变量, 由 className 决定 styles.css 里哪套规则接管:
    //   无 className    → .combatant-figure .portrait-image  战斗立绘半身像(1:1 cover)
    //   ally-portrait   → .ally-figure .portrait-image       底部队伍卡的半身取景(--bust-zoom)
    //   menu-portrait   → 基础规则 .portrait-image           全身(contain)
    // 后两者共用 --portrait-dx/dy; --head-* 暂无使用方(见上方登记表的注释)。
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
