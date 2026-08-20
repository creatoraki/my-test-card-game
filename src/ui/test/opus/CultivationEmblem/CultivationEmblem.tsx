import { useId, type ReactElement, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import {
  CULTIVATED_PALETTE,
  CULTIVATING_PALETTE,
  type EmblemPalette,
  type GradientSpec,
} from "./emblemPalette";
import {
  BUD_POINT,
  CENTER,
  CREST_BAND_PATH,
  EDGE_FRAME,
  EMBLEM_VIEWBOX,
  INNER_FRAME,
  LEAF_LIT_PATH,
  LEAF_PATH,
  LEAF_VEIN_PATH,
  MIRROR_X,
  OUTER_FRAME,
  PETAL_ANGLES,
  PETAL_INNER_TIP,
  PETAL_INNER_WAIST,
  PETAL_SHADE_TIP,
  PETAL_SHADE_WAIST,
  PETAL_TIP,
  PETAL_WAIST,
  PISTIL,
  RING_RADIUS,
  ROOT_PATH,
  SEED_CORE,
  SOIL_EDGE_PATH,
  SOIL_PATH,
  STEM_PATH,
  insetFrame,
  petalEdgePath,
  petalPath,
  polarPoint,
  type FrameRect,
} from "./emblemGeometry";
import s from "./CultivationEmblem.module.css";

// 「培育植物」BUFF 图标 · 厚涂拟物版 —— 两态, 纯 SVG 现画, 不依赖任何位图。
//
// ★ 与旁边的线稿版(../CultivationSigil)是**两套并行方案**, 不是替代关系。
//   线稿版只靠剪影区分两态; 这一版按 BUFF 图标的实战需求, 把区分压在三条线上:
//     颜色 —— 全冷青 vs 全暖金, 两套**独立复合配色**, 不是同色相深浅;
//     光亮 —— 培育中整体压暗只留一个胚珠亮点, 完成态整体推亮 + 满框光池;
//     形状 —— 地平线分割的对称双叶芽(无环) vs 六向放射的花冠(满环), 横分割 vs 中心放射。
//   三条线任意一条单独拿掉都还能认, 这是图标能上状态条的硬标准。
// ★ 厚涂的立体感来自「底色 / 暗面 / 亮边」三层叠在同一个形上, 所以颜色不能是 currentColor:
//   单一变量表达不了三档的相对关系。配色固定在 emblemPalette, 调用方不改色。
// ⚠ 动画全部写在 CSS(不用 SMIL): animated=false 与 prefers-reduced-motion 两条关停
//   路径都要能生效, SMIL 两者都管不到。
// ⚠ defs 里的 id 必须逐实例唯一(useId): 同页并排多枚时, 重名 filter / gradient 会被
//   后挂载的那个顶掉, 表现为「其中一枚突然变黑或不发光」。

export type CultivationEmblemProps = {
  /** 外层布局类(这枚图标在自己的槽位里占多大)。图标外观一律由本组件持有。 */
  className?: string;
  /** 是否播放呼吸 / 脉冲等微动效。默认开。 */
  animated?: boolean;
  /** 无障碍名称; 传 null 表示纯装饰(交给同级文字承担语义)。 */
  label?: string | null;
};

/** 内亮线: 贴着内沿再往里缩一档。和内沿上那道暗边一起, 叠出「框有厚度」。 */
const INNER_LINE = insetFrame(INNER_FRAME, 1.1);

/** 把 FrameRect 摊成 <rect> 的属性。1:1 由 inset 相等保证, 这里不会出现非方形。 */
function frameProps(f: FrameRect) {
  return { x: f.inset, y: f.inset, width: f.size, height: f.size, rx: f.radius, ry: f.radius };
}

/** useId 会带冒号, 直接塞进 url(#...) 在部分实现里解析不了, 先洗成纯字母数字。 */
function useSafeId(): string {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** 把配色层的渐变 key 拼成本实例专属的 url(#...)。 */
function paint(uid: string, key: string): string {
  return `url(#ce-${uid}-${key})`;
}

/** 把配色层的渐变数据摊成 <defs> 里的真实节点。 */
function GradientDefs({ uid, specs }: { uid: string; specs: GradientSpec[] }): ReactElement {
  return (
    <>
      {specs.map((spec) => {
        const stops = spec.stops.map((stop) => (
          <stop
            key={stop.offset}
            offset={stop.offset}
            stopColor={stop.color}
            stopOpacity={stop.opacity}
          />
        ));
        return spec.kind === "linear" ? (
          <linearGradient
            key={spec.key}
            id={`ce-${uid}-${spec.key}`}
            x1={spec.x1 ?? "0%"}
            y1={spec.y1 ?? "0%"}
            x2={spec.x2 ?? "0%"}
            y2={spec.y2 ?? "100%"}
          >
            {stops}
          </linearGradient>
        ) : (
          <radialGradient
            key={spec.key}
            id={`ce-${uid}-${spec.key}`}
            cx={spec.cx}
            cy={spec.cy}
            r={spec.r}
            fx={spec.fx}
            fy={spec.fy}
          >
            {stops}
          </radialGradient>
        );
      })}
    </>
  );
}

/**
 * 两态共用的外框 —— 满幅 1:1 圆角方框。
 *
 * 由外到内一共五层, 每层都在解决「摆进暗场景图」的一个具体问题:
 *   1. 外沿暗环 —— 背景是深色场景图时, 亮边可能和背景撞亮度而消失, 暗环是保底的边界;
 *   2. 底板     —— 中心略亮的径向渐变, 把视线收到中间;
 *   3. 光池     —— 主体背后一团弥散光(裁在框内), 代替上一版溢到盘外的 aura;
 *   4. 内投影   —— 四边压暗的暗角, 盖在内容之上, 让主体"陷"在框里而不是浮在框上;
 *   5. 内暗边 + 内亮线 + 外亮边 —— 三道描边叠出框的厚度。
 *
 * ⚠ 内容一律裁进 INNER_FRAME: 呼吸 / 脉冲 / 高斯发光都可能长出去, 只要漏出框外一点,
 *   图标在场景图上就没有边界了。裁切是硬约束, 不是保险。
 */
function EmblemPlate({
  uid,
  palette,
  className,
  animated,
  label,
  children,
}: {
  uid: string;
  palette: EmblemPalette;
  className?: string;
  animated: boolean;
  label?: string | null;
  children: ReactNode;
}): ReactElement {
  const glowId = `ce-glow-${uid}`;
  const clipId = `ce-clip-${uid}`;
  const poolId = `ce-pool-${uid}`;
  const vignetteId = `ce-vig-${uid}`;

  return (
    <svg
      className={cx(s.emblem, animated && s.animated, className)}
      viewBox={`0 0 ${EMBLEM_VIEWBOX} ${EMBLEM_VIEWBOX}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        {/* 外发光: 「光亮」这一维的主要载体。培育中半径小强度弱, 完成态大而强。
            滤镜作用域收在 ±20%: 再大也会被内沿裁掉, 白算。 */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={palette.glow.blur} result="blur" />
          <feComponentTransfer in="blur" result="soft">
            <feFuncA type="linear" slope={palette.glow.opacity} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="soft" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* 内容的硬边界。 */}
        <clipPath id={clipId}>
          <rect {...frameProps(INNER_FRAME)} />
        </clipPath>

        {/* 光池: 主体背后那团弥散光, 颜色跟着两态各自的 glow 走。 */}
        <radialGradient id={poolId}>
          <stop offset="0%" stopColor={palette.glow.color} stopOpacity={palette.glow.opacity * 0.3} />
          <stop offset="55%" stopColor={palette.glow.color} stopOpacity={palette.glow.opacity * 0.1} />
          <stop offset="100%" stopColor={palette.glow.color} stopOpacity="0" />
        </radialGradient>

        {/* 内投影: 中心全透、四边压暗。盖在内容之上, 主体才是"陷"在框里的。 */}
        <radialGradient id={vignetteId} cx="50%" cy="47%" r="62%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>

        <GradientDefs uid={uid} specs={palette.gradients} />
      </defs>

      {/* 1 外沿暗环: 暗场景图上先用一圈更暗的边把图标切出来 —— 亮边会和背景撞亮度, 这圈不会。 */}
      <rect {...frameProps(EDGE_FRAME)} fill="none" stroke="#000" strokeWidth="2" opacity="0.55" />

      {/* 2 底板 */}
      <rect {...frameProps(OUTER_FRAME)} fill={paint(uid, "plate")} />

      {/* 3~4 内容区: 光池 → 主体 → 内投影, 整组裁在内沿里。 */}
      <g clipPath={`url(#${clipId})`}>
        <circle className={s.aura} cx={CENTER} cy={CENTER} r="46" fill={`url(#${poolId})`} />
        <g filter={`url(#${glowId})`}>{children}</g>
        <rect {...frameProps(INNER_FRAME)} fill={`url(#${vignetteId})`} />
      </g>

      {/* 5 三道描边: 内暗边压厚度 → 内亮线提一档 → 外亮边定边界。 */}
      <rect {...frameProps(INNER_FRAME)} fill="none" stroke="#000" strokeWidth="1.6" opacity="0.5" />
      <rect
        {...frameProps(INNER_LINE)}
        fill="none"
        stroke={palette.ink.rim}
        strokeWidth="0.9"
        opacity="0.3"
      />
      <rect
        {...frameProps(OUTER_FRAME)}
        fill="none"
        stroke={palette.ink.rim}
        strokeWidth="1.6"
        opacity="0.95"
      />
    </svg>
  );
}

/**
 * 培育中 —— 一条地平线切开画面: 上面是左右对称的双叶芽, 下面是埋着胚珠的实心土台。
 * 整体压暗、只留胚珠一个亮点: 「还没成」首先是**暗**。
 * 构图刻意只留三件(土台 / 双叶芽 / 胚珠), 元素越少剪影越硬, 缩到 20px 才不糊 ——
 * 所以这一态**没有环**: 环是完成态的独占符号, 有环 / 无环本身就是最快读到的区分。
 */
export function CultivatingEmblem({
  className,
  animated = true,
  label = "培育植物·进行中",
}: CultivationEmblemProps): ReactElement {
  const uid = useSafeId();
  const p = CULTIVATING_PALETTE;

  return (
    <EmblemPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      {/* 芽: 直茎 + 顶苞 + 左右镜像的一对叶。整组一起摆, 摆轴在土面。 */}
      <g className={s.sprout}>
        <path
          d={STEM_PATH}
          fill="none"
          stroke={paint(uid, "stem")}
          strokeWidth="3.6"
          strokeLinecap="round"
        />

        {/* 一片叶画三层: 叶面渐变 / 叶脉暗线 / 上缘亮边 —— 厚涂的三档就在这三笔里。
            左叶不另写路径, 直接镜像同一条, 顺带把光源统一在右上。 */}
        {[
          { key: "r", transform: undefined, lit: 0.85, face: 1 },
          { key: "l", transform: MIRROR_X, lit: 0.4, face: 0.82 },
        ].map((side) => (
          <g key={side.key} transform={side.transform}>
            <path d={LEAF_PATH} fill={paint(uid, "leaf")} opacity={side.face} />
            <path
              d={LEAF_VEIN_PATH}
              fill="none"
              stroke={p.ink.vein}
              strokeWidth="1.4"
              opacity="0.55"
            />
            <path
              d={LEAF_LIT_PATH}
              fill="none"
              stroke={p.ink.hilite}
              strokeWidth="1.3"
              opacity={side.lit * 0.7}
            />
          </g>
        ))}

        {/* 顶苞: 对称构图的顶点, 也是苗的"还没开"。 */}
        <circle cx={BUD_POINT.x} cy={BUD_POINT.y} r={BUD_POINT.r} fill={paint(uid, "stem")} />
        <circle
          className={s.tip}
          cx={BUD_POINT.x - 1}
          cy={BUD_POINT.y - 1}
          r={BUD_POINT.r * 0.42}
          fill={p.ink.hilite}
        />
      </g>

      {/* 土台: 一块实心暗剪影 + 一道地平线亮边。没有暗纹 —— 它只负责压住下半张。 */}
      <g className={s.soil}>
        <path d={SOIL_PATH} fill={paint(uid, "soil")} />
        <path d={SOIL_EDGE_PATH} fill="none" stroke={p.ink.soilLit} strokeWidth="1.6" opacity="0.5" />
      </g>

      {/* 胚珠: 隔着土层透出来的唯一亮点, 底下一条主根往暗处扎。 */}
      <g className={s.seed}>
        <path d={ROOT_PATH} fill="none" stroke={p.ink.soilLit} strokeWidth="1.4" opacity="0.35" />
        <circle
          className={s.core}
          cx={SEED_CORE.x}
          cy={SEED_CORE.y}
          r={SEED_CORE.r * 2.6}
          fill={paint(uid, "core")}
        />
        <circle cx={SEED_CORE.x} cy={SEED_CORE.y} r={SEED_CORE.r * 0.5} fill={p.ink.hilite} />
      </g>
    </EmblemPlate>
  );
}

/**
 * 培育完成 —— 六瓣花冠的正面纹章。
 * 整体推亮一档并放大外发光: 与培育中并排时, **亮度差**比形状更快被读到。
 */
export function CultivatedEmblem({
  className,
  animated = true,
  label = "培育植物·已完成",
}: CultivationEmblemProps): ReactElement {
  const uid = useSafeId();
  const p = CULTIVATED_PALETTE;

  return (
    <EmblemPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      {/* 完成环: 满圈闭合, 且**只有这一态有环** —— 培育中整枚不带环, 有 / 无环
          比"弧走了多少"更快被读到, 20px 下尤其明显。 */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        fill="none"
        stroke={p.ink.arcTrack}
        strokeWidth="3"
      />
      <circle
        className={s.doneRing}
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        fill="none"
        stroke={p.ink.arc}
        strokeWidth="3"
      />

      {/* 光环脉冲: 完成瞬间的余韵, 两圈错峰外推拼成连续的一道。 */}
      <g className={s.halo}>
        <circle cx={CENTER} cy={CENTER} r="32" fill="none" stroke={p.ink.arc} strokeWidth="2" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r="32"
          fill="none"
          stroke={p.ink.arc}
          strokeWidth="2"
          style={{ animationDelay: "1.2s" }}
        />
      </g>

      <g className={s.bloom}>
        {/* 内层小瓣: 错开 30° 压在外瓣缝里, 整体更沉一档。 */}
        <g>
          {PETAL_ANGLES.map((deg) => (
            <path
              key={`i${deg}`}
              d={petalPath(PETAL_INNER_TIP, PETAL_INNER_WAIST)}
              fill={paint(uid, "petalInner")}
              transform={`rotate(${deg + 30} ${CENTER} ${CENTER})`}
            />
          ))}
        </g>

        {/* 外层实瓣: 瓣根金橙 → 瓣尖黄绿, 右半描一道亮边立起厚度。 */}
        <g>
          {PETAL_ANGLES.map((deg) => (
            <g key={`o${deg}`} transform={`rotate(${deg} ${CENTER} ${CENTER})`}>
              <path d={petalPath(PETAL_TIP, PETAL_WAIST)} fill={paint(uid, "petal")} />
              <path
                d={petalPath(PETAL_SHADE_TIP, PETAL_SHADE_WAIST)}
                fill={p.ink.petalShade}
                opacity="0.5"
              />
              <path
                d={petalEdgePath(PETAL_TIP, PETAL_WAIST)}
                fill="none"
                stroke={p.ink.petalLit}
                strokeWidth="1.4"
                opacity="0.7"
              />
            </g>
          ))}
        </g>
      </g>

      {/* 花心: 暗环压边 + 暖白爆点, 把中心从花冠里顶出来。 */}
      <g className={s.pistil}>
        <circle cx={CENTER} cy={CENTER} r={PISTIL.outer} fill={p.ink.petalShade} opacity="0.85" />
        <circle
          className={s.core}
          cx={CENTER}
          cy={CENTER}
          r={PISTIL.inner * 2.4}
          fill={paint(uid, "core")}
        />
        <circle cx={CENTER} cy={CENTER} r={PISTIL.core} fill={p.ink.hilite} />
      </g>

      {/* 环外指针: 对齐 6 瓣, 每瓣尖外一小道 —— 把花冠和框钉在一起。
          两端卡在瓣尖(38)与完成环(RING_RADIUS)之间, 跟着环半径走, 不写死。 */}
      <g stroke={p.ink.arc} strokeWidth="2" opacity="0.8">
        {PETAL_ANGLES.map((deg) => {
          const a = polarPoint(deg, PETAL_TIP + 2);
          const b = polarPoint(deg, RING_RADIUS - 2);
          return <line key={`m${deg}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </g>

      {/* 纹章托带: 品红托带做冷暖对冲。 */}
      <g>
        <path d={CREST_BAND_PATH} fill={paint(uid, "crest")} />
      </g>
    </EmblemPlate>
  );
}
