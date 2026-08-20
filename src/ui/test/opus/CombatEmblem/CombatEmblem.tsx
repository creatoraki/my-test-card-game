import { useId, type ReactElement, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import {
  INSIGHT_PALETTE,
  KEEN_PALETTE,
  WARD_PALETTE,
  type EmblemPalette,
  type GradientSpec,
} from "./combatPalette";
import {
  BLADE_EDGE_PATH,
  BLADE_FULLER_PATH,
  BLADE_PATH,
  BLADE_SHADE_PATH,
  BROW_PATH,
  CENTER,
  CROWN_DOTS,
  CROWN_GEM_PATH,
  EDGE_FRAME,
  EMBLEM_VIEWBOX,
  EYE_HILITE,
  EYE_LID_PATH,
  EYE_LOWER_PATH,
  EYE_PATH,
  EYE_SCAN_PATH,
  HEX_NODES,
  HEX_PATH,
  INNER_FRAME,
  IRIS,
  IRIS_RAYS,
  KEEN_WIND_PATH,
  MIRROR_X,
  OUTER_FRAME,
  PUPIL,
  SHIELD_BAND_PATH,
  SHIELD_CREST_PATH,
  SHIELD_EDGE_PATH,
  SHIELD_PATH,
  SHIELD_SHADE_PATH,
  SHIELD_SPINE_PATH,
  SIGHT_RAYS,
  SPARK_PATH,
  WHETSTONE_EDGE_PATH,
  WHETSTONE_PATH,
  insetFrame,
  type FrameRect,
} from "./combatGeometry";
import s from "./CombatEmblem.module.css";

// 战斗三态 BUFF 图标(锋利 / 护盾 / 心眼) · 厚涂拟物版 —— 纯 SVG 现画, 不依赖任何位图。
//
// ★ 与旁边的培育两态(../CultivationEmblem)**同规格不同族**: 外框三圈、viewBox 128、内沿裁切
//   全部复用同一份几何, 所以五枚可以互换槽位; 但主体构图与配色各自独立。
// ★ 三枚之间的区分压在三条线上, 任意一条单独拿掉都还能认 —— 这是能上状态条的硬标准:
//     剪影 —— 竖长的刃 / 上宽下尖的盾 / 横躺的杏仁眼, 三种长宽比;
//     环   —— 只有护盾带外圈六边能量场(有环 / 无环在 20px 下比内部细节快得多);
//     色相 —— 钢青白 / 靛底暖金 / 深紫, 三块色斑摆一起就能分。
// ★ 厚涂的立体感来自「底色 / 暗面 / 亮边」三层叠在同一个形上, 所以颜色不能是 currentColor:
//   单一变量表达不了三档的相对关系。配色固定在 combatPalette, 调用方不改色。
// ⚠ 动画全部写在 CSS(不用 SMIL): animated=false 与 prefers-reduced-motion 两条关停路径
//   都要能生效, SMIL 两者都管不到。
// ⚠ defs 里的 id 必须逐实例唯一(useId): 同页并排多枚时, 重名 filter / gradient / clipPath 会被
//   后挂载的那个顶掉, 表现为「其中一枚突然变黑或不发光」。

export type CombatEmblemProps = {
  /** 外层布局类(这枚图标在自己的槽位里占多大)。图标外观一律由本组件持有。 */
  className?: string;
  /** 是否播放呼吸 / 扫描等微动效。默认开。 */
  animated?: boolean;
  /** 无障碍名称; 传 null 表示纯装饰(交给同级文字承担语义)。 */
  label?: string | null;
};

/** 内亮线: 贴着内沿再往里缩一档, 和内沿的暗边一起叠出「框有厚度」。 */
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
  return `url(#cb-${uid}-${key})`;
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
            id={`cb-${uid}-${spec.key}`}
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
            id={`cb-${uid}-${spec.key}`}
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
 * 三枚共用的外框 —— 满幅 1:1 圆角方框, 与培育两态同规格。
 *
 * 由外到内一共五层, 每层都在解决「摆进暗场景图」的一个具体问题:
 *   1. 外沿暗环 —— 背景是深色场景图时亮边可能撞亮度而消失, 暗环是保底的边界;
 *   2. 底板     —— 中心略亮的径向渐变, 把视线收到中间;
 *   3. 光池     —— 主体背后一团弥散光, 裁在框内;
 *   4. 内投影   —— 四边压暗的暗角, 盖在内容之上, 让主体"陷"在框里而不是浮在框上;
 *   5. 内暗边 + 内亮线 + 外亮边 —— 三道描边叠出框的厚度。
 *
 * ⚠ 内容一律裁进 INNER_FRAME: 呼吸 / 扫描 / 高斯发光都可能长出去, 只要漏出框外一点,
 *   图标在场景图上就没有边界了。裁切是硬约束, 不是保险。
 */
function CombatPlate({
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
  const glowId = `cb-glow-${uid}`;
  const clipId = `cb-clip-${uid}`;
  const poolId = `cb-pool-${uid}`;
  const vignetteId = `cb-vig-${uid}`;

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
        {/* 外发光: 「光亮」这一维的主要载体。滤镜作用域收在 ±20%: 再大也会被内沿裁掉, 白算。 */}
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

        {/* 光池: 主体背后那团弥散光, 颜色跟着各态自己的 glow 走。 */}
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

      {/* 1 外沿暗环 */}
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
 * 锋利 —— 一把没有柄的窄长刃立在磨刀台上, 刃尖迸一点火花。
 * 三件形(刃 / 台 / 火花)+ 两道风刃, 元素越少剪影越硬, 缩到 20px 才不糊。
 * 这一枚的性格是**对比**: 底盘近黑、刃口近白, 中间几乎不留过渡档。
 */
export function KeenEmblem({
  className,
  animated = true,
  label = "锋利",
}: CombatEmblemProps): ReactElement {
  const uid = useSafeId();
  const p = KEEN_PALETTE;

  return (
    <CombatPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      {/* 风刃: 贴着刃身外缘的两道虚线弧, 靠 dashoffset 往上流。
          左侧不另写路径, 直接镜像同一条 —— 两边永远不会画歪。 */}
      <g className={s.wind} stroke={p.ink.wind} strokeWidth="1.6" opacity="0.34">
        <path d={KEEN_WIND_PATH} />
        <path d={KEEN_WIND_PATH} transform={MIRROR_X} />
      </g>

      {/* 磨刀台: 一块实心暗剪影 + 一道台面亮边。它只负责压住下半张。 */}
      <g>
        <path d={WHETSTONE_PATH} fill={paint(uid, "stone")} />
        <path
          d={WHETSTONE_EDGE_PATH}
          fill="none"
          stroke={p.ink.stoneLit}
          strokeWidth="1.5"
          opacity="0.45"
        />
      </g>

      {/* 刃身四层: 底色 → 背光暗面 → 中轴血槽 → 右刃口亮边。厚涂的三档就在后三笔里。 */}
      <g className={s.blade}>
        <path d={BLADE_PATH} fill={paint(uid, "blade")} />
        <path d={BLADE_SHADE_PATH} fill={p.ink.shade} opacity="0.5" />
        <path d={BLADE_FULLER_PATH} fill="none" stroke={p.ink.fuller} strokeWidth="1.5" opacity="0.7" />
        <path
          className={s.edge}
          d={BLADE_EDGE_PATH}
          fill="none"
          stroke={p.ink.edge}
          strokeWidth="1.7"
          opacity="0.85"
        />
      </g>

      {/* 火花: 全冷画面里唯一的暖色, 也是整枚图标的视觉落点。 */}
      <g className={s.spark}>
        <path d={SPARK_PATH} fill={paint(uid, "spark")} />
      </g>
    </CombatPlate>
  );
}

/**
 * 护盾 —— 一面正面朝外的盾, 外圈套一圈六边能量场。
 * **只有这一枚带外环**: 有环 / 无环比"盾里画了什么"快得多, 20px 下尤其明显。
 */
export function WardEmblem({
  className,
  animated = true,
  label = "护盾",
}: CombatEmblemProps): ReactElement {
  const uid = useSafeId();
  const p = WARD_PALETTE;
  const bandClipId = `cb-band-${uid}`;

  return (
    <CombatPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      <defs>
        {/* 扫带被盾形裁住: 带子本身是一条横贯整框的实体, 只有落在盾面上的那截该被看见。 */}
        <clipPath id={bandClipId}>
          <path d={SHIELD_PATH} />
        </clipPath>
      </defs>

      {/* 六边能量场: 底衬一圈暗轨 + 上面一圈虚线, 虚线慢速反向转。
          顶点上的六枚铆钉把环钉在框上, 免得它像一圈随手描的线。 */}
      <g className={s.field}>
        <path d={HEX_PATH} fill="none" stroke={p.ink.fieldTrack} strokeWidth="3" />
        <path
          className={s.fieldDash}
          d={HEX_PATH}
          fill="none"
          stroke={p.ink.field}
          strokeWidth="2"
          strokeDasharray="10 7"
          opacity="0.8"
        />
        {HEX_NODES.map((node) => (
          <circle key={node.key} cx={node.x} cy={node.y} r="2.6" fill={p.ink.field} opacity="0.9" />
        ))}
      </g>

      {/* 盾体四层: 底色 → 背光暗面 → 盾脊 → 右侧受光边。 */}
      <g className={s.shield}>
        <path d={SHIELD_PATH} fill={paint(uid, "shield")} />
        <path d={SHIELD_SHADE_PATH} fill={p.ink.shade} opacity="0.42" />
        <path d={SHIELD_SPINE_PATH} fill="none" stroke={p.ink.shade} strokeWidth="1.4" opacity="0.5" />
        <path
          d={SHIELD_EDGE_PATH}
          fill="none"
          stroke={p.ink.edge}
          strokeWidth="1.6"
          opacity="0.75"
        />

        {/* 能量扫带: 冷色压在暖盾面上, 上下扫过。 */}
        <g clipPath={`url(#${bandClipId})`}>
          <path className={s.band} d={SHIELD_BAND_PATH} fill={paint(uid, "band")} />
        </g>

        {/* 盾心徽记: 暗环压边 + 暖白爆点, 把中心从盾面里顶出来。 */}
        <g className={s.crest}>
          <path d={SHIELD_CREST_PATH} fill={p.ink.crest} opacity="0.8" />
          <circle className={s.core} cx={CENTER} cy={CENTER} r="9" fill={paint(uid, "core")} />
          <circle cx={CENTER} cy={CENTER} r="3.2" fill={p.ink.hilite} />
        </g>
      </g>
    </CombatPlate>
  );
}

/**
 * 心眼 —— 一只横躺的杏仁眼, 竖瞳, 额上一枚三点冠。
 * 三枚里整体亮度最低: 除虹膜与额饰外都压在中低调 ——「看透」的表达是**收**不是放,
 * 一枚亮眼睛落在暗背景里, 比满屏发光更像在盯着人。
 */
export function InsightEmblem({
  className,
  animated = true,
  label = "心眼",
}: CombatEmblemProps): ReactElement {
  const uid = useSafeId();
  const p = INSIGHT_PALETTE;
  const irisClipId = `cb-iris-${uid}`;

  return (
    <CombatPlate uid={uid} palette={p} className={className} animated={animated} label={label}>
      <defs>
        {/* 扫描线裁在虹膜里: 一条扫出眼球的线会立刻变成"贴在眼上的横杠"。 */}
        <clipPath id={irisClipId}>
          <circle cx={CENTER} cy={CENTER} r={IRIS.r} />
        </clipPath>
      </defs>

      {/* 眉弧 + 额饰三点冠: 上半张的横向节奏, 也是"第三只眼"的唯一交代。 */}
      <path d={BROW_PATH} fill="none" stroke={p.ink.brow} strokeWidth="2" opacity="0.5" />
      <g className={s.crown}>
        <path d={CROWN_GEM_PATH} fill={paint(uid, "gem")} />
        {CROWN_DOTS.map((dot) => (
          <circle key={dot.key} cx={dot.x} cy={dot.y} r={dot.r} fill={p.ink.brow} opacity="0.85" />
        ))}
      </g>

      {/* 眼眶三层: 眼白底色 → 下眼睑暗面 → 上眼睑亮边。 */}
      <g className={s.eye}>
        <path d={EYE_PATH} fill={paint(uid, "sclera")} />
        <path d={EYE_LOWER_PATH} fill="none" stroke={p.ink.shade} strokeWidth="2.4" opacity="0.7" />
        <path d={EYE_LID_PATH} fill="none" stroke={p.ink.edge} strokeWidth="1.8" opacity="0.8" />

        {/* 虹膜: 球面渐变 + 放射纹 + 暗环压边, 三笔把平面的圆变成一颗球。 */}
        <g className={s.iris}>
          <circle cx={CENTER} cy={CENTER} r={IRIS.r} fill={paint(uid, "iris")} />
          <g stroke={p.ink.vein} strokeWidth="1.1" opacity="0.5">
            {IRIS_RAYS.map((ray) => (
              <line key={ray.key} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
            ))}
          </g>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={IRIS.ringR}
            fill="none"
            stroke={p.ink.shade}
            strokeWidth="1.2"
            opacity="0.45"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={IRIS.r}
            fill="none"
            stroke={p.ink.shade}
            strokeWidth="1.6"
            opacity="0.75"
          />

          {/* 扫描线: 裁在虹膜里上下扫, 这枚图标唯一的"机械感"。 */}
          <g clipPath={`url(#${irisClipId})`}>
            <path className={s.scan} d={EYE_SCAN_PATH} fill={p.ink.scan} opacity="0.5" />
          </g>

          {/* 竖瞳 + 瞳心透光 + 眼球高光。高光偏右上, 和其余四枚共用同一个光源。 */}
          <ellipse cx={CENTER} cy={CENTER} rx={PUPIL.rx} ry={PUPIL.ry} fill={p.ink.pupil} />
          <ellipse
            className={s.pupil}
            cx={CENTER}
            cy={CENTER}
            rx={PUPIL.rx * 0.55}
            ry={PUPIL.ry * 0.7}
            fill={paint(uid, "core")}
          />
          <circle cx={EYE_HILITE.x} cy={EYE_HILITE.y} r={EYE_HILITE.r} fill={p.ink.hilite} opacity="0.9" />
        </g>
      </g>

      {/* 眼下三道短光芒: 视线落下来的方向, 顺带收掉下半张的空白。 */}
      <g className={s.sight} stroke={p.ink.brow} strokeWidth="1.8" opacity="0.45">
        {SIGHT_RAYS.map((ray) => (
          <path key={ray.key} d={ray.d} />
        ))}
      </g>
    </CombatPlate>
  );
}
