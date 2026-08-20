// ★ BUFF 图标 v6「厚涂方框」★ —— ds 开发者的实现。
//
// 五个 1:1 自包含 SVG 图标(viewBox 0 0 128 128, 满幅圆角方框), 不依赖位图, 无任何文字:
//   · 培育植物(进行中) ——「萌发」: 裂壳种子, 嫩芽从裂缝探出, 2/3 进度弧 + 游标;
//   · 培育植物(完成)   ——「绽放」: 八瓣花冠(外层实瓣 + 内层错开 22.5° 小瓣),
//     满圈完成环 + 8 根环外指针 + 纹章托带;
//   · 锋利             ——「直刃」: 一把竖直太刀(银白刀身 + 刃口亮边 + 剑脊), 剑尖金星;
//   · 心眼             ——「洞悉」: 一只金属义眼(紫铜环带 + 虹膜 + 发光瞳孔), 眼顶棱光;
//   · 护盾             ——「壁垒」: 一块青蓝圆盾(面渐变 + 受光高光), 中央菱形核心。
//
// ★ v6 设计语言: 厚涂方框 + 光池内影 + 少元素剪影 ★
//   · 外框: 五个图标共用同一套**满幅 1:1 圆角方框**(外沿暗环 / 底板 / 光池 / 内投影 /
//     三道描边), 内容一律裁进内沿 —— 压在任何背景上都不漏角, 零外溢;
//   · 厚涂: 每个主体都是「底色 / 暗面 / 亮边」三层叠在同一块形上 —— 半边高光路径
//     只描受光侧, 立体感来自明暗三档的相对关系, 而不是整圈描边;
//   · 光亮: 外发光滤镜(feGaussianBlur + feComponentTransfer)按配色控制半径与强度,
//     培育中弱(内敛) / 完成态强(外放), 框内再叠一团光池 + 四边内投影, 主体「陷」在框里;
//   · 颜色: 五套独立复合配色(深靛褐绿 / 深赭金橙 / 深钢蓝银 / 深紫品红 / 深青青蓝),
//     色相本身就是语义, 与盘底高对比;
//   · 构图: 每枚只留两到三件形(种子+芽 / 花冠 / 刀 / 眼 / 盾) —— 元素越少剪影越硬,
//     缩到 20px 依然可读;
//   · 视角: 培育中「裂壳」是过程, 完成态「花冠纹章」是成果, 不靠文字也读得出先后。
//
// 语义对齐卡牌设定: 「培育 N」计数归零后卡面效果升级; 锋利(sharp)使攻击伤害 ×1.1;
// 心眼是卡牌实例标记; 护盾吸收伤害。
// ⚠ 动画全部写在 CSS(不用 SMIL): animated=false 与 prefers-reduced-motion
//   两条关停路径都要能生效。
// ⚠ defs 里的 id 必须逐实例唯一(useId): 同页并排多枚时, 重名 filter / gradient 会被
//   后挂载的那个顶掉, 表现为「其中一枚突然变黑或不发光」。
import { useId, type ReactElement, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import {
  BEAM_PATH,
  BLADE_EDGE,
  BLADE_PATH,
  BLADE_RIDGE,
  CENTER,
  COTYLEDON_LEFT,
  COTYLEDON_RIGHT,
  CORE_DIAMOND,
  CORE_HILITE,
  CRACK_PATH,
  CREST_BAND_PATH,
  EYE,
  EYE_RINGS,
  EDGE_FRAME,
  GROWING_RATIO,
  HILT_H,
  HILT_W,
  HILT_WRAP_Y,
  HILT_X,
  HILT_Y,
  INNER_FRAME,
  OUTER_FRAME,
  PETAL_ANGLES,
  PETAL_INNER_TIP,
  PETAL_INNER_WAIST,
  PETAL_SHADE_TIP,
  PETAL_SHADE_WAIST,
  PETAL_TIP,
  PETAL_WAIST,
  PISTIL,
  POMEL,
  PROGRESS_HEAD,
  PUPIL_ARC,
  PUPIL_HILITE,
  RING_LIT,
  RING_RADIUS,
  ROOT_PATHS,
  SEED_LIT_PATH,
  SEED_PATH,
  SHIELD,
  SHIELD_LIT,
  SPROUT_STEM,
  SPROUT_TIP,
  STAR,
  TSUBA,
  VIEWBOX,
  arcDash,
  frameProps,
  insetFrame,
  petalEdgePath,
  petalPath,
  polarPoint,
} from "./dsBuffGeometry";
import {
  DONE_PALETTE,
  GROWING_PALETTE,
  MIND_PALETTE,
  SHARP_PALETTE,
  SHIELD_PALETTE,
  type BuffPalette,
  type GradientSpec,
} from "./dsBuffPalette";
import s from "./DsPlantBuffIcons.module.css";

export type PlantBuffIconProps = {
  /** 外层布局类(这枚图标在自己的槽位里占多大)。图标外观一律由本组件持有。 */
  className?: string;
  /** 是否播放呼吸 / 脉冲等微动效。默认开。 */
  animated?: boolean;
  /** 无障碍名称; 传 null 表示纯装饰(交给同级文字承担语义)。 */
  label?: string | null;
};

/** 内暗边 / 内亮线: 贴着内沿再往里缩两档, 叠出「框有厚度」。 */
const INNER_SHADE = insetFrame(INNER_FRAME, 0);
const INNER_LINE = insetFrame(INNER_FRAME, 1.1);

/** useId 会带冒号, 直接塞进 url(#...) 在部分实现里解析不了, 先洗成纯字母数字。 */
function useSafeId(): string {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** 把配色层的渐变 key 拼成本实例专属的 url(#...)。 */
function paint(uid: string, key: string): string {
  return `url(#db-${uid}-${key})`;
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
            id={`db-${uid}-${spec.key}`}
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
            id={`db-${uid}-${spec.key}`}
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
 * 五枚图标共用的厚涂方框。
 *
 * 由外到内一共五层, 每层都在解决「摆进暗场景图」的一个具体问题:
 *   1. 外沿暗环 —— 背景是深色场景图时, 亮边可能和背景撞亮度而消失, 暗环是保底的边界;
 *   2. 底板     —— 中心略亮的径向渐变, 把视线收到中间;
 *   3. 光池     —— 主体背后一团弥散光(裁在框内), 代替上一版溢到盘外的 aura;
 *   4. 内投影   —— 四边压暗的暗角, 盖在内容之上, 让主体「陷」在框里而不是浮在框上;
 *   5. 内暗边 + 内亮线 + 外亮边 —— 三道描边叠出框的厚度。
 *
 * ⚠ 内容一律裁进 INNER_FRAME: 呼吸 / 脉冲 / 高斯发光都可能长出去, 只要漏出框外一点,
 *   图标在场景图上就没有边界了。裁切是硬约束, 不是保险。
 */
function BuffPlate({
  uid,
  palette,
  className,
  animated,
  label,
  children,
}: {
  uid: string;
  palette: BuffPalette;
  className?: string;
  animated: boolean;
  label?: string | null;
  children: ReactNode;
}): ReactElement {
  const glowId = `db-glow-${uid}`;
  const clipId = `db-clip-${uid}`;
  const poolId = `db-pool-${uid}`;
  const vigId = `db-vig-${uid}`;

  return (
    <svg
      className={cx(s.plate, animated && s.animated, className)}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        {/* 外发光: 强弱由配色控制。作用域收在 ±20%: 再大也会被内沿裁掉, 白算。 */}
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

        {/* 光池: 主体背后那团弥散光, 颜色跟着各枚的 glow 走。 */}
        <radialGradient id={poolId}>
          <stop offset="0%" stopColor={palette.glow.color} stopOpacity={palette.glow.opacity * 0.3} />
          <stop offset="55%" stopColor={palette.glow.color} stopOpacity={palette.glow.opacity * 0.1} />
          <stop offset="100%" stopColor={palette.glow.color} stopOpacity="0" />
        </radialGradient>

        {/* 内投影: 中心全透、四边压暗。盖在内容之上, 主体才是「陷」在框里的。 */}
        <radialGradient id={vigId} cx="50%" cy="47%" r="62%">
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
        <rect {...frameProps(INNER_FRAME)} fill={`url(#${vigId})`} />
      </g>

      {/* 5 三道描边: 内暗边压厚度 → 内亮线提一档 → 外亮边定边界。 */}
      <rect {...frameProps(INNER_SHADE)} fill="none" stroke="#000" strokeWidth="1.6" opacity="0.5" />
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
 * 培育中「萌发」—— 裂壳种子: 嫩芽从裂缝探出, 壳底须根下探。
 * 整体压暗, 只有芽尖一个亮点: 「还没成」首先是暗, 其次才是进度弧没走满。
 */
export function CultivatingPlantBuffIcon({
  className,
  animated = true,
  label = "培育植物·进行中",
}: PlantBuffIconProps): ReactElement {
  const uid = useSafeId();
  const p = GROWING_PALETTE;

  return (
    <BuffPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      {/* 进度弧: 暗轨 + 2/3 亮弧 + 游标 —— 断口看得见缺口才成立。 */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        fill="none"
        stroke={p.ink.arcTrack}
        strokeWidth="3"
      />
      <circle
        className={s.arcFlow}
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        fill="none"
        stroke={p.ink.arc}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={arcDash(RING_RADIUS, GROWING_RATIO)}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
      />
      <circle
        className={s.headPulse}
        cx={PROGRESS_HEAD.x}
        cy={PROGRESS_HEAD.y}
        r="3"
        fill={p.ink.hilite}
      />

      {/* 芽: 茎 + 两片卷曲子叶 + 芽尖亮点(整枚唯一高亮源)。 */}
      <g className={s.sprout}>
        <path d={SPROUT_STEM} fill="none" stroke={paint(uid, "sprout")} strokeWidth="3.4" />
        <path d={COTYLEDON_LEFT} fill={paint(uid, "sprout")} />
        <path d={COTYLEDON_RIGHT} fill={paint(uid, "sprout")} opacity="0.7" />
        <circle
          className={s.tipGlow}
          cx={SPROUT_TIP.x}
          cy={SPROUT_TIP.y}
          r={SPROUT_TIP.r * 2.4}
          fill={paint(uid, "tip")}
        />
        <circle cx={SPROUT_TIP.x} cy={SPROUT_TIP.y} r={SPROUT_TIP.r * 0.8} fill={p.ink.hilite} />
      </g>

      {/* 壳: 底色 + 裂缝 + 右半受光边 + 须根。 */}
      <g className={s.seed}>
        <path d={SEED_PATH} fill={paint(uid, "seed")} />
        <path d={CRACK_PATH} fill="none" stroke={p.ink.crack} strokeWidth="1.8" opacity="0.9" />
        <path d={SEED_LIT_PATH} fill="none" stroke={p.ink.seedLit} strokeWidth="1.8" opacity="0.7" />
        {ROOT_PATHS.map((d) => (
          <path key={d} d={d} fill="none" stroke={p.ink.root} strokeWidth="1.5" opacity="0.7" />
        ))}
      </g>
    </BuffPlate>
  );
}

/**
 * 培育完成「绽放」—— 八瓣花冠正面纹章。
 * 整体推亮一档并放大外发光: 与培育中并排时, 亮度差比形状更快被读到。
 */
export function CultivatedPlantBuffIcon({
  className,
  animated = true,
  label = "培育植物·已完成",
}: PlantBuffIconProps): ReactElement {
  const uid = useSafeId();
  const p = DONE_PALETTE;

  return (
    <BuffPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      {/* 完成环: 满圈闭合 —— 与培育态那条断开的进度弧正面对照。 */}
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
        <circle cx={CENTER} cy={CENTER} r="34" fill="none" stroke={p.ink.arc} strokeWidth="2" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r="34"
          fill="none"
          stroke={p.ink.arc}
          strokeWidth="2"
          style={{ animationDelay: "1.2s" }}
        />
      </g>

      {/* 内层小瓣: 错开 22.5° 压在外瓣缝里, 整体更沉一档。 */}
      <g className={s.bloom}>
        <g>
          {PETAL_ANGLES.map((deg) => (
            <path
              key={`i${deg}`}
              d={petalPath(PETAL_INNER_TIP, PETAL_INNER_WAIST)}
              fill={paint(uid, "petalInner")}
              transform={`rotate(${deg + 22.5} ${CENTER} ${CENTER})`}
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

      {/* 花心: 暗环压边 + 暖白爆点。 */}
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

      {/* 环外指针: 对齐 8 瓣, 每瓣尖外一小道 —— 把花冠和框钉在一起。
           两端卡在环外(46)与内沿(55)之间, 跟着环半径走, 不写死。 */}
      <g stroke={p.ink.arc} strokeWidth="2" opacity="0.8">
        {PETAL_ANGLES.map((deg) => {
          const a = polarPoint(deg, RING_RADIUS + 2);
          const b = polarPoint(deg, RING_RADIUS + 6);
          return <line key={`m${deg}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </g>

      {/* 纹章托带: 品红托带做冷暖对冲。 */}
      <path d={CREST_BAND_PATH} fill={paint(uid, "crest")} />
    </BuffPlate>
  );
}

/**
 * 锋利「直刃」—— 一把竖直太刀。
 * 刀身银白渐变(左亮右暗), 刃口单独描亮边, 剑尖金星聚焦。
 * 上一版的磨石 / 火星 / 放射光全部去掉: 「锋利」的语义一把刀就够了, 元素越少剪影越硬。
 */
export function SharpBuffIcon({
  className,
  animated = true,
  label = "锋利",
}: PlantBuffIconProps): ReactElement {
  const uid = useSafeId();
  const p = SHARP_PALETTE;

  return (
    <BuffPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      {/* 剑尖金星光晕 */}
      <circle className={s.starPulse} cx={STAR.x} cy={STAR.y} r="6" fill={paint(uid, "star")} />
      <circle cx={STAR.x} cy={STAR.y} r="1.9" fill={p.ink.hilite} />

      {/* 刀身: 左亮右暗的银白渐变 + 外轮廓。 */}
      <g className={s.blade}>
        <path
          d={BLADE_PATH}
          fill={paint(uid, "blade")}
          stroke={p.ink.bladeRim}
          strokeWidth="1.4"
        />
        {/* 剑脊线: 分出亮面与暗面。 */}
        <path d={BLADE_RIDGE} fill="none" stroke={p.ink.ridge} strokeWidth="0.9" opacity="0.7" />
        {/* 刃口亮边: 光从右侧来。 */}
        <path d={BLADE_EDGE} fill="none" stroke={p.ink.edge} strokeWidth="1.2" opacity="0.95" />

        {/* 刀镡: 圆格 + 内圈线。 */}
        <circle cx={TSUBA.cx} cy={TSUBA.cy} r={TSUBA.r} fill={paint(uid, "hilt")} />
        <circle
          cx={TSUBA.cx}
          cy={TSUBA.cy}
          r={TSUBA.r - 1.6}
          fill="none"
          stroke={p.ink.ridge}
          strokeWidth="0.8"
          opacity="0.8"
        />

        {/* 柄 + 缠线 + 柄头金珠。 */}
        <rect
          x={HILT_X}
          y={HILT_Y}
          width={HILT_W}
          height={HILT_H}
          rx="2.4"
          fill={paint(uid, "hilt")}
        />
        {HILT_WRAP_Y.map((y) => (
          <path
            key={y}
            d={`M${HILT_X} ${y} h${HILT_W}`}
            stroke={p.ink.ridge}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        ))}
        <circle cx={POMEL.cx} cy={POMEL.cy} r={POMEL.r} fill={p.ink.gold} />
        <circle cx={POMEL.cx} cy={POMEL.cy} r={POMEL.r * 0.45} fill={p.ink.goldLit} />
      </g>
    </BuffPlate>
  );
}

/**
 * 心眼「洞悉」—— 一只金属义眼。
 * 紫铜环带(外圆 + 内圆合成厚度) + 虹膜 + 发光瞳孔, 眼顶一道洞察棱光向上放射。
 * 上一版的 12 放射瞳纹 / 四向光芒全部去掉: 环套环在小尺寸下只会糊成一团。
 */
export function MindEyeBuffIcon({
  className,
  animated = true,
  label = "心眼",
}: PlantBuffIconProps): ReactElement {
  const uid = useSafeId();
  const p = MIND_PALETTE;

  return (
    <BuffPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      {/* 洞察棱光: 金白三角, 从眼顶向上放射。 */}
      <g className={s.beam}>
        <path d={BEAM_PATH} fill={paint(uid, "beam")} />
        <path d={BEAM_PATH} fill="none" stroke={p.ink.hilite} strokeWidth="0.8" opacity="0.6" />
      </g>

      {/* 瞳孔聚焦光晕 */}
      <circle
        className={s.eyeGlow}
        cx={EYE.cx}
        cy={EYE.cy}
        r={EYE_RINGS.outer + 3}
        fill={paint(uid, "pupil")}
      />

      {/* 金属环带: 外圆铺环面, 内圆挖出眼窝 —— 一条有宽度的环, 而不是两道描边。 */}
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE_RINGS.outer} fill={paint(uid, "ring")} />
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE_RINGS.inner} fill={p.ink.socket} />
      <path d={RING_LIT} fill="none" stroke={p.ink.ringLit} strokeWidth="1.4" opacity="0.7" />

      {/* 虹膜: 品红紫径向渐变。 */}
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE_RINGS.iris} fill={paint(uid, "iris")} />

      {/* 瞳孔: 深紫实心 + 聚焦亮点 + 反光弧。 */}
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE_RINGS.pupil} fill={p.ink.pupilSolid} />
      <g className={s.pupilPulse}>
        <circle
          cx={EYE.cx}
          cy={EYE.cy}
          r={EYE_RINGS.pupil * 0.55}
          fill={paint(uid, "pupil")}
        />
        <circle cx={PUPIL_HILITE.x} cy={PUPIL_HILITE.y} r={PUPIL_HILITE.r} fill="#ffffff" />
        <path
          d={PUPIL_ARC}
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.9"
          opacity="0.7"
        />
      </g>
    </BuffPlate>
  );
}

/**
 * 护盾「壁垒」—— 一块圆盾。
 * 盾面青蓝渐变 + 受光高光 + 中央菱形核心。
 * 上一版的六边形线 / 能量弧 / 投影 / 漂浮泡全部去掉: 一块盾 + 一颗核心, 剪影最硬。
 */
export function ShieldBuffIcon({
  className,
  animated = true,
  label = "护盾",
}: PlantBuffIconProps): ReactElement {
  const uid = useSafeId();
  const p = SHIELD_PALETTE;

  return (
    <BuffPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      {/* 盾底柔光 */}
      <circle
        className={s.shieldGlow}
        cx={SHIELD.cx}
        cy={SHIELD.cy}
        r={SHIELD.r + 6}
        fill={paint(uid, "core")}
      />

      {/* 圆盾: 青蓝渐变 + 外描边。 */}
      <circle
        cx={SHIELD.cx}
        cy={SHIELD.cy}
        r={SHIELD.r}
        fill={paint(uid, "face")}
        stroke={p.ink.faceRim}
        strokeWidth="2.8"
      />
      {/* 盾面受光高光。 */}
      <path
        d={SHIELD_LIT}
        fill="none"
        stroke={p.ink.hilite}
        strokeWidth="1.6"
        strokeOpacity="0.6"
        strokeLinecap="round"
      />

      {/* 菱形核心 + 高光点。 */}
      <g className={s.corePulse}>
        <path
          d={CORE_DIAMOND}
          fill={paint(uid, "core")}
          stroke={p.ink.coreRim}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx={CORE_HILITE.x} cy={CORE_HILITE.y} r={CORE_HILITE.r} fill="#ffffff" />
      </g>
    </BuffPlate>
  );
}
