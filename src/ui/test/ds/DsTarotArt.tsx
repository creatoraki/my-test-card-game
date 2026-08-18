// ★ 塔罗羁绊 · 1:1 素材图标 ★ —— ds 开发者的实现。
//
// 画风复刻 EventPanel 的事件插图占位区(scenePlaceholder):
//   深色渐变底 + 主色径向光晕 + 主色虚线轨道环 + 切角内框,
//   中央是每张牌专属的发光线稿徽记, 与占位区中央 glyph 同一套「档案徽记」语言。
//
// ★ 线条分三层, 保证画面有主次层次:
//   · core     —— 牌面主体的外轮廓: 粗线(2.0) + 强发光, 是全图最先被看到的东西;
//   · detail   —— 主体内部的结构线/细节: 细线(1.3) + 弱发光 + 稍降不透明度;
//   · ambient  —— 光点/碎屑等环境点缀: 最细(1.0) + 无发光 + 明显压暗。
//   六张牌共用同一套分层规则与笔触参数, 只是每层的具体线条不同。
//
// 组件是自包含 SVG(viewBox 0 0 120 120, 1:1), 不依赖外部图片, 无任何文字;
// 主题色 / 编号 / 牌名全部来自 @/data/bonds 的 BOND_DEFS, 不重复配一份。
// 后续替换为正式美术立绘时, 直接换掉 MOTIFS 里的图案即可, 外壳与数据不变。
import { useId, type ReactNode } from "react";
import { getBondDef } from "@/data/bonds";

// ---- 每张牌的中央图案: 三层线稿, 统一用 currentColor 继承主色 ----
// 元素坐标都在 120 视口内, 中央图案集中在 (60, 56) 附近, 不越过内框(19~101)。
type MotifLayers = {
  core: ReactNode;
  detail: ReactNode;
  ambient: ReactNode;
};

const MOTIFS: Record<string, MotifLayers> = {
  // 力量 VIII: 头顶无限符号 ∞, 下方一只攥紧的拳头 —— 「以柔驯猛」。
  strength: {
    core: (
      <>
        <ellipse cx="50" cy="32" rx="13" ry="7.5" transform="rotate(-20 50 32)" />
        <ellipse cx="70" cy="32" rx="13" ry="7.5" transform="rotate(20 70 32)" />
        <rect x="46" y="50" width="28" height="22" rx="6" />
        <path d="M50 50c0-5 3-8 6-8s6 3 6 8" />
        <path d="M62 50c0-5 3-8 6-8s6 3 6 8" />
        <path d="M46 58c-5 1-7 4-6 8 1 3 4 5 7 4" />
      </>
    ),
    detail: (
      <>
        <path d="M46 68h28" />
        <path d="M50 62c6 3 14 3 20 0" />
      </>
    ),
    ambient: (
      <>
        <circle cx="38" cy="46" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="82" cy="48" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="75" cy="20" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="60" cy="32" r="1.5" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // 战车 VII: 星幕车篷 + 车体 + 大车轮, 斜前方的引路矛旗 —— 「驾驭矛盾的方向感」。
  chariot: {
    core: (
      <>
        <path d="M38 50c0-8 7-13 22-13s22 5 22 13" />
        <path d="M38 50h44l-6 14H44z" />
        <circle cx="60" cy="71" r="18" />
      </>
    ),
    detail: (
      <>
        <circle cx="60" cy="71" r="4.5" />
        <path d="M60 53v36M42 71h36M49 60l22 22M71 60 49 82" />
        <path d="M60 50v14" />
        <path d="M84 26v20" />
        <path d="M84 26l13 4-13 5" />
      </>
    ),
    ambient: (
      <>
        <circle cx="30" cy="40" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="90" cy="18" r="1.1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // 审判 XX: 斜置号角 + 声波扩散 + 顶端的十字 —— 「号角落下的那一刻」。
  judgement: {
    core: (
      <>
        <path d="M40 84c1-13 9-21 24-25l10-3" />
        <path d="M74 55l11 3-7 13-10-6z" />
        <path d="M40 84l-5 3" />
      </>
    ),
    detail: (
      <>
        <path d="M89 60c5 3 5 12 0 15" />
        <path d="M95 54c9 5 9 21 0 26" />
        <path d="M56 26v-10M51 21h10" />
        <path d="M34 84h50" />
      </>
    ),
    ambient: (
      <>
        <circle cx="30" cy="58" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="84" cy="84" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // 女祭司 II: 帘杆下的帷幕 + 顶端月牙 + 中央书卷 —— 「帷幕之后的静默知识」。
  priestess: {
    core: (
      <>
        <path d="M30 44h60" />
        <path d="M34 44c6 6 12 6 18 0M86 44c-6 6-12 6-18 0" />
        <path d="M34 44v40M86 44v40" />
        <path d="M62 16a11 11 0 1 0 8 14 9 9 0 1 1-8-14Z" />
        <rect x="52" y="56" width="16" height="13" rx="2" />
      </>
    ),
    detail: (
      <>
        <path d="M44 44v40M52 44v40M68 44v40M76 44v40" />
        <path d="M52 62h16M58 56v13" />
      </>
    ),
    ambient: (
      <>
        <circle cx="40" cy="60" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="80" cy="60" r="1.3" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // 高塔 XVI: 尖顶塔楼 + 劈落的闪电 + 坠落王冠与火花 —— 「崩塌之前，先把墙筑得更厚」。
  tower: {
    core: (
      <>
        <path d="M47 84l-5-38h36l-5 38z" />
        <path d="M52 46l8-13 8 13" />
        <path d="M56 18l-9 22h10l-8 20 20-28h-10l7-14z" />
        <path d="M74 14l3-5 3 5 3-5 3 5v4H74z" />
      </>
    ),
    detail: (
      <>
        <path d="M47 47h26" />
        <path d="M56 56c0-3 2-5 5-5s5 2 5 5v14H56z" />
        <path d="M56 62h10" />
      </>
    ),
    ambient: (
      <>
        <circle cx="70" cy="10" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="86" cy="13" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="51" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // 愚者 0: 右上太阳 + 持杖旅人 + 杖头行囊与脚下白犬 —— 「毫无计划地起步」。
  fool: {
    core: (
      <>
        <circle cx="84" cy="22" r="6" />
        <circle cx="62" cy="50" r="5" />
        <path d="M62 55c-9 1-13 9-13 23h26c0-14-4-22-13-23Z" />
        <path d="M58 56l-12 24" />
      </>
    ),
    detail: (
      <>
        <path d="M84 12v-4M84 36v-4M74 22h-4M98 22h-4M76 14l-3-3M92 30l3 3M92 14l3-3M76 30l-3 3" />
        <circle cx="46" cy="70" r="4" />
        <path d="M82 70c-4 0-7 3-7 7h14c0-4-3-7-7-7Z" />
        <circle cx="88" cy="64" r="3.5" />
        <path d="M88 60.5l-1-4 3 2" />
        <path d="M76 72c-3 0-4 2-3 4" />
      </>
    ),
    ambient: (
      <>
        <circle cx="52" cy="36" r="1.3" fill="currentColor" stroke="none" />
      </>
    ),
  },
};

export interface DsTarotArtProps {
  bondId: string;
  className?: string;
}

export function DsTarotArt({ bondId, className }: DsTarotArtProps) {
  const def = getBondDef(bondId);
  // useId 会带冒号, 而冒号在 SVG id / url(#) 里不合法, 统一替换掉。
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!def) return null;
  const accent = def.color;
  const Motif = MOTIFS[bondId] ?? null;

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={`${def.name} ${def.arcana}`}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#172427" />
          <stop offset="0.6" stopColor="#0b1114" />
          <stop offset="1" stopColor="#11191c" />
        </linearGradient>
        <radialGradient id={`${uid}-halo`} cx="0.5" cy="0.44" r="0.5">
          <stop offset="0" stopColor={accent} stopOpacity="0.24" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        {/* 主体轮廓的强发光 */}
        <filter id={`${uid}-glow-strong`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="b" />
          <feFlood floodColor={accent} floodOpacity="0.6" result="c" />
          <feComposite in="c" in2="b" operator="in" result="cb" />
          <feMerge>
            <feMergeNode in="cb" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* 结构细节的弱发光 */}
        <filter id={`${uid}-glow-soft`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="b" />
          <feFlood floodColor={accent} floodOpacity="0.32" result="c" />
          <feComposite in="c" in2="b" operator="in" result="cb" />
          <feMerge>
            <feMergeNode in="cb" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 深色渐变底 + 主色径向光晕 */}
      <rect width="120" height="120" fill={`url(#${uid}-bg)`} />
      <circle cx="60" cy="53" r="44" fill={`url(#${uid}-halo)`} />

      {/* 主色虚线轨道环 —— 替代占位区 sceneOrb 外环的氛围层, 给画面一个向心力 */}
      <circle
        cx="60"
        cy="56"
        r="42"
        fill="none"
        stroke={accent}
        strokeOpacity="0.16"
        strokeWidth="0.8"
        strokeDasharray="2 7"
      />

      {/* 切角内框(主色, 与中央图案同一色调) */}
      <path
        d="M31 19H89L101 31V89L89 101H31L19 89V31Z"
        fill="none"
        stroke={accent}
        strokeOpacity="0.36"
        strokeWidth="1"
      />

      {/* 中央发光图案 —— 三层: core 粗亮 / detail 细弱 / ambient 暗点缀 */}
      {Motif && (
        <>
          <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            color={accent}
            strokeWidth={2}
            filter={`url(#${uid}-glow-strong)`}
          >
            {Motif.core}
          </g>
          <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            color={accent}
            strokeWidth={1.3}
            opacity={0.78}
            filter={`url(#${uid}-glow-soft)`}
          >
            {Motif.detail}
          </g>
          <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            color={accent}
            strokeWidth={1}
            opacity={0.4}
          >
            {Motif.ambient}
          </g>
        </>
      )}
    </svg>
  );
}
