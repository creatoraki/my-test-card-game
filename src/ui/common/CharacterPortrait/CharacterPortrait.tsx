import swordsmanPortrait from "@/assets/人物立绘/剑士-透明.png";
import gluttonPortrait from "@/assets/人物立绘/大胃王-透明.png";
import botanistPortrait from "@/assets/人物立绘/植物学家-透明.png";
import { cx } from "@/ui/common/cx";
import s from "./CharacterPortrait.module.css";

// 角色立绘登记表(与 enemyArt.ts 同思路: 静态 import + 登记表, 按 CharacterDef.id 作键)。
// 立绘只登记在 UI 层 —— data/characters.ts 不碰素材路径, 与 enemyArt.ts / battleBg.ts 同约定。
interface CharacterArtDef {
  src: string;
  // 半身取景的微调偏移(px, 正=右/下)。各角色原图里身体的水平位置、留白高低不一,
  // 靠它把人挪回槽位中央。三套半身取景(战斗立绘 / 队伍卡 / 当前角色大卡)共用这一对参数,
  // 菜单的 .menu-portrait 全身像不受影响。
  dx?: number;
  dy?: number;
  // 底部队伍卡半身像的个体取景倍率(默认 1 = 跟随 AllyBar 的 --bust-zoom)。
  // 各角色原图的人物占画幅比例不一样, 同一个 --bust-zoom 下有的人显小, 靠它单独补偿。
  bustScale?: number;
  // 头部取景的微调参数(zoom = 图宽相对取景窗宽的倍率; dx/dy = 缩放后的位置微调)。
  // ⚠ 目前**没有使用方** —— 底部队伍卡已从「头部裁切的玻璃头像」改为「带框半身立绘」,
  // 半身走上面的 dx/dy。这套参数保留登记, 留给后续需要圆头像的界面(如编队/结算页)。
  head?: { zoom?: number; dx?: number; dy?: number };
}

const CHARACTER_ART: Record<string, CharacterArtDef> = {
  // 剑士: 原图人物偏左(左手持剑外展占了画面左侧), 右移 20px 才在槽位里居中;
  //       原图人物在画幅里偏小, 队伍卡里比其他人矮一头 ⇒ bustScale 单独放大一点
  swordsman: {
    src: swordsmanPortrait,
    dx: 10,
    bustScale: 1.25,
    head: { zoom: 1.15, dx: 4, dy: -18 },
  },
  // 大胃王: 取景偏移尚未校准, 先按 0 登记, 看到实际画面后再微调
  glutton: { src: gluttonPortrait },
  // 植物学家: 原图头顶留白偏多, 放大后人在窗里压得偏低 ⇒ 整体上移一点
  botanist: { src: botanistPortrait, bustScale: 1.35, dy: -20 },
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
    // ★ 取景一律由**使用方**通过 className 传进来(样式铁律 3) —— 本组件不认识任何
    //   调用者的类名。当前的六套取景各自住在使用方的 module.css 里:
    //     combatant-portrait → 战斗立绘半身像(1:1 cover) — battle/CombatantView
    //     ally-portrait      → 底部队伍卡半身(--bust-zoom × --bust-scale) — battle/AllyBar
    //     fm-bust / cd-bust / cryo-portrait / exp-portrait / menu-portrait → 各页自持
    //   不传 className ⇒ 只吃本文件的基础规则(全身 contain)。
    // 下发的这组 --portrait-* / --bust-scale / --head-* 是**跨组件契约**(样式铁律 4):
    // CSS 变量不受 Modules 哈希影响, 是模块边界上唯一合法的通道。改名要连同所有取景一起改。
    return (
      <img
        className={cx(s["portrait-image"], className)}
        src={art.src}
        alt={alt}
        style={
          {
            "--portrait-dx": `${art.dx ?? 0}px`,
            "--portrait-dy": `${art.dy ?? 0}px`,
            "--bust-scale": `${art.bustScale ?? 1}`,
            "--head-zoom": `${art.head?.zoom ?? 1}`,
            "--head-dx": `${art.head?.dx ?? 0}px`,
            "--head-dy": `${art.head?.dy ?? 0}px`,
          } as React.CSSProperties
        }
      />
    );
  }

  // 未登记立绘的角色退回 emoji
  return <span className={cx(s["portrait"], className)}>{emoji}</span>;
}
