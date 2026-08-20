import { useId, type ReactElement, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import {
  CENTER,
  PETAL_ANGLES,
  ROOT_PATHS,
  SIGIL_VIEWBOX,
  SOIL_STRATA,
  arcDash,
  cutSquarePath,
  petalPath,
  podPath,
  polarPoint,
  ringTicks,
  strataPath,
} from "./cultivationGeometry";
import s from "./CultivationSigil.module.css";

// 「培育植物」BUFF 图标 —— 两态, 纯 SVG 现画, 不依赖任何位图。
//
// ★ 设计立场: 这是**状态图标**不是插画。它要在 20px 的状态条里也认得出来,
//   所以两态的差别压在**轮廓剪影**上(竖长的荚 vs 放射的花冠), 而不是压在细节或颜色上。
//   颜色只是加强, 去掉颜色两张图依然可分 —— 这是 BUFF 图标能不能用的硬标准。
// ★ 母题: 两枚共用同一副切角方形外框 + 同半径刻度环, 核心构图完全不同。
//   外框负责「这是同一套 BUFF」, 核心负责「这是哪一态」。
// ★ 颜色一律 currentColor: 换色只需在外层给 color, 不需要第二份组件。
// ⚠ 动画全部写在 CSS(不用 SMIL): 这样 animated=false 与 prefers-reduced-motion
//   两条关停路径都能生效, SMIL 两者都管不到。
// ⚠ defs 里的 id 必须逐实例唯一(useId): 同页并排两枚图标时, 重名 filter 会
//   被后挂载的那个顶掉, 表现为「其中一枚突然不发光」。

export type CultivationSigilProps = {
  /** 外层布局类(这枚图标在自己的槽位里占多大)。图标外观一律由本组件持有。 */
  className?: string;
  /** 是否播放呼吸 / 脉冲等微动效。默认开。 */
  animated?: boolean;
  /** 无障碍名称; 传 null 表示纯装饰(交给同级文字承担语义)。 */
  label?: string | null;
};

/** 外框刻度: 24 根, 每 4 根加长一次 —— 与完成态的 6 瓣同因数, 阵列对得上。 */
const FRAME_TICKS = ringTicks(24, 58, 3, 6, 4);

const OUTER_FRAME = cutSquarePath(56, 14);
const INNER_FRAME = cutSquarePath(48, 12);

/** 培育中的进度弧: 停在 2/3, 是「还没长完」的唯一定量表达。 */
const PROGRESS_RADIUS = 52;
const PROGRESS_RATIO = 0.66;
const PROGRESS_HEAD = polarPoint(PROGRESS_RATIO * 360, PROGRESS_RADIUS);

/** useId 会带冒号, 直接塞进 url(#...) 在部分实现里解析不了, 先洗成纯字母数字。 */
function useSafeId(): string {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** 两态共用的底盘: 柔光 + 切角外框 + 刻度环。 */
function SigilFrame({
  uid,
  className,
  animated,
  label,
  children,
}: {
  uid: string;
  className?: string;
  animated: boolean;
  label?: string | null;
  children: ReactNode;
}) {
  const glow = `cs-glow-${uid}`;
  const haze = `cs-haze-${uid}`;

  return (
    <svg
      className={cx(s.sigil, animated && s.animated, className)}
      viewBox={`0 0 ${SIGIL_VIEWBOX} ${SIGIL_VIEWBOX}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        {/* 发光: 线稿霓虹感的全部来源。半径克制, 放大后才不会糊成一团光斑。 */}
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* 中心柔光: 让核心「浮」在框里, 而不是贴在背景上。 */}
        <radialGradient id={haze}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.07" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={CENTER} cy={CENTER} r={54} fill={`url(#${haze})`} stroke="none" />

      <g className={s.frame} strokeWidth="1.5">
        <path d={OUTER_FRAME} opacity="0.65" />
        <path d={INNER_FRAME} opacity="0.2" strokeDasharray="3 5" />
      </g>

      <g className={s.ticks} strokeWidth="1.2">
        {FRAME_TICKS.map((tick) => (
          <line
            key={tick.key}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            opacity={tick.long ? 0.55 : 0.22}
          />
        ))}
      </g>

      <g filter={`url(#${glow})`}>{children}</g>
    </svg>
  );
}

/**
 * 培育中 —— 土壤中的种子剖面。
 * 剖面视角(看得见地下)是刻意的: 它表达「过程正在发生但还看不见成果」, 正好是 BUFF 未完成的语义。
 */
export function CultivatingSigil({
  className,
  animated = true,
  label = "培育植物·进行中",
}: CultivationSigilProps): ReactElement {
  const uid = useSafeId();

  return (
    <SigilFrame uid={uid} className={className} animated={animated} label={label}>
      {/* 未满的进度弧: 从 12 点起顺时针画 2/3 圈, 缓慢流动。 */}
      <circle
        className={s.progress}
        cx={CENTER}
        cy={CENTER}
        r={PROGRESS_RADIUS}
        strokeWidth="2"
        strokeDasharray={arcDash(PROGRESS_RADIUS, PROGRESS_RATIO)}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
        opacity="0.9"
      />
      {/* 弧头的游标: 标出长到哪儿了。 */}
      <circle
        className={s.progressHead}
        cx={PROGRESS_HEAD.x}
        cy={PROGRESS_HEAD.y}
        r="2.6"
        fill="currentColor"
        stroke="none"
      />

      {/* 地层: 三条下凹线, 越深越淡。 */}
      <g className={s.soil} strokeWidth="1.5">
        {SOIL_STRATA.map((layer) => (
          <path
            key={layer.key}
            d={strataPath(layer.y, layer.dip, layer.halfWidth)}
            opacity={layer.opacity}
          />
        ))}
      </g>

      {/* 种荚 + 中缝 + 内里的胚。整体轻微呼吸。 */}
      <g className={s.pod}>
        <path d={podPath()} strokeWidth="1.8" opacity="0.95" />
        <path d={`M${CENTER} 47V75`} strokeWidth="1.1" opacity="0.4" strokeDasharray="2 3.5" />
        <ellipse cx={CENTER} cy="64" rx="5" ry="7" strokeWidth="1.2" opacity="0.55" />
        <circle className={s.core} cx={CENTER} cy="64" r="2.4" fill="currentColor" stroke="none" />
      </g>

      {/* 未展开的芽尖: 荚顶探出一小截, 顶端两片没张开的子叶。 */}
      <g className={s.sprout} strokeWidth="1.5">
        <path d={`M${CENTER} 44V30`} opacity="0.85" />
        <path d={`M${CENTER} 34c-7-1-10-6-10-12 6 0 10 5 10 12z`} opacity="0.7" />
        <path d={`M${CENTER} 32c6-1 9-5 9-11-5 0-9 4-9 11z`} opacity="0.45" />
      </g>

      {/* 须根: 向下岔开, 极缓地左右摆。 */}
      <g className={s.roots} strokeWidth="1.3" opacity="0.6">
        {ROOT_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </SigilFrame>
  );
}

/**
 * 培育完成 —— 花冠绽放的正面纹章。
 * 换成正面对称视角是有意为之: 剖面是「过程」, 正面纹章是「成果被展示出来」,
 * 两种视角本身就在讲两个阶段, 不靠文字也读得出先后。
 */
export function CultivatedSigil({
  className,
  animated = true,
  label = "培育植物·已完成",
}: CultivationSigilProps): ReactElement {
  const uid = useSafeId();

  return (
    <SigilFrame uid={uid} className={className} animated={animated} label={label}>
      {/* 完成环: 满圈闭合 —— 与培育态那条断开的进度弧正面对照。 */}
      <circle className={s.doneRing} cx={CENTER} cy={CENTER} r={PROGRESS_RADIUS} strokeWidth="2" />
      {/* 光环脉冲: 完成瞬间的余韵, 一圈圈外推。 */}
      <g className={s.halo}>
        <circle cx={CENTER} cy={CENTER} r="34" strokeWidth="1.4" style={{ animationDelay: "0s" }} />
        <circle cx={CENTER} cy={CENTER} r="34" strokeWidth="1.4" style={{ animationDelay: "1.2s" }} />
      </g>

      {/* 花冠: 6 瓣阵列。外层实瓣 + 内层小瓣错开 30°, 做出层次而不加细节。 */}
      <g className={s.bloom}>
        <g strokeWidth="1.6" opacity="0.9">
          {PETAL_ANGLES.map((deg) => (
            <path
              key={`o${deg}`}
              d={petalPath(34, 15)}
              transform={`rotate(${deg} ${CENTER} ${CENTER})`}
            />
          ))}
        </g>
        <g strokeWidth="1.2" opacity="0.4">
          {PETAL_ANGLES.map((deg) => (
            <path
              key={`i${deg}`}
              d={petalPath(20, 9)}
              transform={`rotate(${deg + 30} ${CENTER} ${CENTER})`}
            />
          ))}
        </g>
      </g>

      {/* 花心: 同心双环 + 中心亮点。 */}
      <g className={s.pistil}>
        <circle cx={CENTER} cy={CENTER} r="9" strokeWidth="1.5" opacity="0.85" />
        <circle cx={CENTER} cy={CENTER} r="5" strokeWidth="1.1" opacity="0.5" />
        <circle className={s.core} cx={CENTER} cy={CENTER} r="2.6" fill="currentColor" stroke="none" />
      </g>

      {/* 环外刻度: 对齐 6 瓣, 每瓣尖外一小道 —— 把花冠和外框钉在一起。 */}
      <g strokeWidth="1.6" opacity="0.7">
        {PETAL_ANGLES.map((deg) => {
          const a = polarPoint(deg, 40);
          const b = polarPoint(deg, 46);
          return <line key={`m${deg}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </g>

      {/* 纹章托带: 底部一横把整枚图标压稳。 */}
      <g className={s.crest} strokeWidth="1.5">
        <path d={`M${CENTER - 22} ${CENTER + 46}h44`} opacity="0.45" />
      </g>
    </SigilFrame>
  );
}
