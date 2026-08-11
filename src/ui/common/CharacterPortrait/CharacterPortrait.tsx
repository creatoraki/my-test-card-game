import swordsmanPortrait from "@/assets/人物立绘/剑士/default.png";
import botanistPortrait from "@/assets/人物立绘/植物学家/default.png";
import prophetPortrait from "@/assets/人物立绘/预言家/default.png";
import { cx } from "@/ui/common/cx";
import s from "./CharacterPortrait.module.css";

// 所有角色立绘统一为 1152×2048 / 9:16 / 透明底 / 左右中心对称。

// 角色立绘登记表(与 enemyArt.ts 同思路: 静态 import + 登记表, 按 CharacterDef.id 作键)。
// 立绘只登记在 UI 层 —— data/characters.ts 不碰素材路径, 与 enemyArt.ts / battleBg.ts 同约定。
interface CharacterArtDef {
  src: string;
  // 半身取景的异常构图逃生舱(px, 正=右/下), 常规统一规格立绘不需要覆盖。
  // 三套半身取景(战斗立绘 / 队伍卡 / 当前角色大卡)共用这一对参数,
  // 菜单的 .menu-portrait 全身像不受影响。
  dx?: number;
  dy?: number;
  // 底部队伍卡半身像的异常构图逃生舱(默认 1 = 跟随 AllyBar 的 --bust-zoom)。
  bustScale?: number;
  // 头部取景参数(zoom = 图宽相对取景窗宽的倍率; dx/dy = 缩放后的位置微调)。
  // CryoScene 的 .cryo-portrait 使用这组参数; dx/dy 仅为异常构图保留。
  head?: { zoom?: number; dx?: number; dy?: number };
}

// 统一规格下三人共用同一套取景参数; 只有将来出现非对称/异常构图的立绘才在个体条目里覆盖。
const UNIFORM_FRAMING = {
  dx: 0,
  dy: 0,
  bustScale: 1,
  // 头部窗口(冬眠仓小头像): 统一立绘里头部位置一致, 一个 zoom 全员通用。
  head: { zoom: 4, dx: 0, dy: 0 },
} as const;

const CHARACTER_ART: Record<string, CharacterArtDef> = {
  swordsman: { src: swordsmanPortrait, ...UNIFORM_FRAMING },
  prophet: { src: prophetPortrait, ...UNIFORM_FRAMING },
  botanist: { src: botanistPortrait, ...UNIFORM_FRAMING },
};

export const CHARACTER_ART_SOURCES: readonly string[] = [...new Set(
  Object.values(CHARACTER_ART).map((def) => def.src),
)];

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
