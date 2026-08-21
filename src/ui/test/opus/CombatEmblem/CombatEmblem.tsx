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
  CENTER,
  EDGE_FRAME,
  EMBLEM_VIEWBOX,
  EYE_ARCS,
  EYE_BOUNCE,
  EYE_FIBER,
  EYE_FIBER_ANGLES,
  EYE_GLEAM,
  EYE_GLEAM_MINOR,
  EYE_INNER,
  EYE_IRIS,
  EYE_LIDS,
  EYE_LID_SHADOW,
  EYE_OUTER,
  EYE_PUPIL,
  INNER_FRAME,
  KEEN_ARC,
  KEEN_BLADE,
  KEEN_BLADE_FACE,
  KEEN_BLOOD,
  KEEN_BLOOD_LIT,
  KEEN_DROP,
  KEEN_EDGE,
  KEEN_EDGE_BACK,
  KEEN_FACE_LIT,
  KEEN_FACE_SHADE,
  KEEN_GEM,
  KEEN_GRIP,
  KEEN_GUARD,
  KEEN_GUARD_LIT,
  KEEN_POMMEL,
  KEEN_TILT,
  OUTER_FRAME,
  WARD_BELT,
  WARD_BELT_LIT,
  WARD_BELT_LOW,
  WARD_BOUNCE,
  WARD_CORE,
  WARD_CORE_INNER,
  WARD_FACE,
  WARD_FACET_SHADE,
  WARD_LIT,
  WARD_OUTER,
  WARD_PINS,
  WARD_RIVETS,
  insetFrame,
  type FrameRect,
} from "./combatGeometry";
import s from "./CombatEmblem.module.css";

// 战斗三态 BUFF 图标(锋利 / 护盾 / 心眼) · 厚涂拟物版 —— 纯 SVG 现画, 不依赖任何位图。
//
// ★ 与旁边的培育两态(../CultivationEmblem)**同规格不同族**: 外框三圈、viewBox 128、内沿裁切
//   全部复用同一份几何, 所以五枚可以互换槽位; 但主体构图与配色各自独立。
//
// ★★ 这一版按**培育两态的美学**整体重画。上一版的病不在画得糙, 在**画得多**:
//    锋芒线四道 + 四角寒芒 + 缠绳四道 + 两滴血珠 + 六枚铆钉 + 两道光弧 + 三条盾脉 +
//    十二条虹膜纤维 + 额冠 + 四角睫线 —— 每件单看都有道理, 堆在 128 见方里就是一地碎屑。
//    抄培育版的四条(几何层里有逐枚的落实说明):
//      ① **构图只留三件形** —— 元素越少剪影越硬, 可读性靠剪影不靠细节量;
//      ② **明暗靠"面"不靠"线"** —— 每个主体切成明暗两面, 交界自成脊, 不再满身描边;
//      ③ **一条贯穿画面的构成线** —— 锋利=对角 / 护盾=横腰线 / 心眼=上下双弧,
//         与培育中的地平线、培育完成的中心放射四条互不重复;
//      ④ **全枚只留一个亮点** —— 刃口一条白 / 菱心爆点 / 瞳心一粒。
//    三枚的剪影只有锋利改了(竖直 → 斜置 40°, 让三枚各领一个方向), 盾与眼原样保留。
//
// ★ 保留的自家规矩: 光源统一右上; 三枚区分压在剪影(斜刃 / 宽盾 / 横眼)与色相(钢青带血 / 全蓝 / 金白)
//   两条线上, 任意一条单独拿掉都还能认 —— 这是能上状态条的硬标准。
// ★ 厚涂的立体感来自「底色 / 暗面 / 亮边」三层叠在同一个形上, 所以颜色不能是 currentColor:
//   单一变量表达不了三档的相对关系。配色固定在 combatPalette, 调用方不改色。
//
// ⚠ 这一版是**静态图标, 没有任何动画**, 所以组件不收 animated 之类的开关。形要在静止状态下
//   就立得住; 哪天需要动效, 从 CSS 侧单独加, 不要再往几何层塞为动效服务的路径。
// ⚠ defs 里的 id 必须逐实例唯一(useId): 同页并排多枚时, 重名 filter / gradient / clipPath 会被
//   后挂载的那个顶掉, 表现为「其中一枚突然变黑或不发光」。

export type CombatEmblemProps = {
  /** 外层布局类(这枚图标在自己的槽位里占多大)。图标外观一律由本组件持有。 */
  className?: string;
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
 * ⚠ 内容一律裁进 INNER_FRAME: 主体这一版顶得很近框边, 高斯发光还会再外扩一圈,
 *   只要漏出框外一点, 图标在场景图上就没有边界了。裁切是硬约束, 不是保险。
 */
function CombatPlate({
  uid,
  palette,
  className,
  label,
  children,
}: {
  uid: string;
  palette: EmblemPalette;
  className?: string;
  label?: string | null;
  children: ReactNode;
}): ReactElement {
  const glowId = `cb-glow-${uid}`;
  const clipId = `cb-clip-${uid}`;
  const poolId = `cb-pool-${uid}`;
  const vignetteId = `cb-vig-${uid}`;

  return (
    <svg
      className={cx(s.emblem, className)}
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
        <circle cx={CENTER} cy={CENTER} r="46" fill={`url(#${poolId})`} />
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
 * 锋利 —— 一把斜置 40° 的刀, 沿对角线吃满整个内沿。
 *
 * 三件形: 刀(一刀切成背光左半 / 受光右半) + 柄(护手 + 握柄 + 柄首连成一块近黑实体) +
 * 一道贯穿画面的斜弧光。亮点只有一个: 右刃口那条纯白线。
 *
 * ★ 按培育两态的美学重排: 上一版是竖直匕首 + 血槽 + 受光斜面 + 四道锋芒线 + 四角寒芒 +
 *   四道缠绳 + 两滴血珠, 十来件形挤在一枚 128 见方里, 32px 下只剩一团灰。
 *   这一版把刃面上的三条形并成"一刀两面"、把五件碎配件换成一道大弧、血从三处减到两处。
 * ★ 剪影从竖长改成**对角**: 盾是中心竖对称、眼是横长, 三枚各领一个方向, 20px 下先读到这个。
 * ⚠ 画序有硬要求, 从下到上: 弧光 → 柄 / 柄首 → 刃身两层 → 明暗两面 → 血 → 刃口亮边 →
 *   护手 → 宝石。血必须压在刃面之上、刃口亮边之下(血挂在刃上, 但盖不住刃口的锋);
 *   护手必须在刃身之后画, 否则会看见刃身穿出护手。
 * ⚠ 刀整组吃一次 rotate, 但**血珠不进这个组**: 血受的是重力不是刀的倾角。
 */
export function KeenEmblem({ className, label = "锋利" }: CombatEmblemProps): ReactElement {
  const uid = useSafeId();
  const p = KEEN_PALETTE;

  return (
    <CombatPlate uid={uid} palette={p} className={className} label={label}>
      {/* 弧光: 画在最底下, 让它看起来是从刀身后透出来的。这一枚的构成线。 */}
      <path d={KEEN_ARC} stroke={p.ink.accent} strokeOpacity="0.35" strokeWidth="2.4" />
      <path d={KEEN_ARC} stroke={p.ink.light} strokeOpacity="0.5" strokeWidth="0.9" />

      {/* ── 刀本体 ──────────────────────────────────────────────
          几何层里全部按竖直坐标写, 摆位交给这一次 rotate(见几何层的说明)。
          渐变跟着 transform 一起转, 竖直系里的「左暗右亮」转完正好是右上光源。 */}
      <g transform={`rotate(${KEEN_TILT} ${CENTER} ${CENTER})`}>
        {/* 握柄: 整枚图标最暗的一块, 用来压住对角线的另一端。 */}
        <path d={KEEN_GRIP} fill={paint(uid, "grip")} stroke={p.ink.deep} strokeWidth="1.4" />

        {/* 柄首: 配重球, 同心两圈。 */}
        <circle
          cx={KEEN_POMMEL.x}
          cy={KEEN_POMMEL.y}
          r={KEEN_POMMEL.r}
          fill={paint(uid, "guard")}
          stroke={p.ink.deep}
          strokeWidth="1.4"
        />
        <circle
          cx={KEEN_POMMEL.x}
          cy={KEEN_POMMEL.y}
          r={KEEN_POMMEL.inner}
          fill="none"
          stroke={p.ink.light}
          strokeOpacity="0.55"
          strokeWidth="1"
        />

        {/* 第一层 刃身外廓: 暗钢底 + 一圈更黑的描边, 先把刃从底盘上切出来。 */}
        <path d={KEEN_BLADE} fill={paint(uid, "blade")} stroke={p.ink.deep} strokeWidth="1.6" />

        {/* 第二层 刃面: 钢的主渐变。 */}
        <path d={KEEN_BLADE_FACE} fill={paint(uid, "face")} />

        {/* 一刀两面: 半透地叠在刃面上, 沿中轴切开。交界自成中脊 —— 不再单画一根线,
            也不再开血槽。培育版一片叶子就是这么分明暗的。 */}
        <path d={KEEN_FACE_SHADE} fill={paint(uid, "faceShade")} />
        <path d={KEEN_FACE_LIT} fill={paint(uid, "faceLit")} />

        {/* 血: 刃身下段靠刃口的一抹, 上缘一道薄亮红(没有这道就只是块暗斑)。 */}
        <path d={KEEN_BLOOD} fill={paint(uid, "blood")} />
        <path d={KEEN_BLOOD_LIT} stroke={p.ink.bloodLit} strokeOpacity="0.7" strokeWidth="1.1" />

        {/* 刃口: 左暗右白 —— 白的这条是整枚图标的亮度峰值。
            压在血之上: 血挂在刃上, 但盖不住刃口的锋。 */}
        <path d={KEEN_EDGE_BACK} stroke={p.ink.shade} strokeOpacity="0.9" strokeWidth="1.6" />
        <path d={KEEN_EDGE} stroke={p.ink.light} strokeWidth="1.6" />

        {/* 护手: 全刀唯一的横向支撑, 盖住刃身的下端。 */}
        <path d={KEEN_GUARD} fill={paint(uid, "guard")} stroke={p.ink.deep} strokeWidth="1.5" />
        <path d={KEEN_GUARD_LIT} stroke={p.ink.light} strokeOpacity="0.7" strokeWidth="1.2" />

        {/* 护手宝石: 全冷画面里唯一的暖, 压住刃身与护手的接缝。 */}
        <path d={KEEN_GEM} fill={paint(uid, "core")} stroke={p.ink.deep} strokeWidth="1.4" />
      </g>

      {/* 一滴垂血珠, 在 rotate 之外画 —— 严格竖直往下坠。 */}
      <path d={KEEN_DROP.d} fill={paint(uid, "drop")} stroke={p.ink.bloodDeep} strokeWidth="1" />
      <circle
        cx={KEEN_DROP.gleam.x}
        cy={KEEN_DROP.gleam.y}
        r={KEEN_DROP.gleam.r}
        fill={p.ink.light}
        opacity="0.65"
      />
    </CombatPlate>
  );
}

/**
 * 护盾 —— 一面占满画面的正面盾, 被一条横腰线切成上下两段, 腰线上压一枚菱心。
 *
 * 三件形: 盾体(外廓 + 盾面) + 横腰线(上受光 / 下沉) + 菱心(有棱角的核心 + 白蓝爆点)。
 * 明暗是**两刀交叉**出来的: 横腰线分上下, 盾脊分左右, 四个块面各占一档明度 ——
 * 金属的体积就是这么来的, 不靠在盾上画阴影。
 *
 * ★ 按培育两态的美学重排: 上一版是三层同心套娃 + 六枚铆钉 + 两道侧光弧 + 三条交叉脉 +
 *   五边形套五边形, 读起来像张示意图。这一版把套娃换成分面、把十来件配件砍到两件。
 * ★ 剪影不动 —— 五枚里体量最大的一枚, 护盾要的就是一块压得住的实体, 这一点上一版是对的。
 * ⚠ 腰线以上 / 以下两块与左半背光块都是**半透叠加**, 底下盾面的主渐变要能透上来;
 *   换成不透明色块, 金属就变成剪纸了。
 */
export function WardEmblem({ className, label = "护盾" }: CombatEmblemProps): ReactElement {
  const uid = useSafeId();
  const p = WARD_PALETTE;

  return (
    <CombatPlate uid={uid} palette={p} className={className} label={label}>
      {/* 第一层 外廓: 近黑底 + 一圈亮蓝边。 */}
      <path d={WARD_OUTER} fill={p.ink.deep} stroke={p.ink.rim} strokeWidth="1.5" />

      {/* 外廓左下的环境反光: 暗面不死黑, 盾的左缘才不会和底盘粘在一起。 */}
      <path d={WARD_BOUNCE} stroke={p.ink.bounce} strokeOpacity="0.5" strokeWidth="1.6" />

      {/* 第二层 盾面: 主渐变。后面所有分面都切在它上面。 */}
      <path d={WARD_FACE} fill={paint(uid, "shield")} />

      {/* 第一刀 · 横腰线分上下: 上段是打磨过的受光面, 下段沉下去。这一枚的构成线。 */}
      <path d={WARD_BELT_LIT} fill={paint(uid, "beltLit")} />
      <path d={WARD_BELT_LOW} fill={paint(uid, "beltLow")} />

      {/* 第二刀 · 盾脊分左右: 光源在右上, 左半整体沉一档。 */}
      <path d={WARD_FACET_SHADE} fill={paint(uid, "facetShade")} />

      {/* 腰线本体: 亮线在上、暗线在下 —— 两条一起才是"一道棱", 单画一条只是一条线。 */}
      <path d={WARD_BELT} stroke={p.ink.shade} strokeOpacity="0.75" strokeWidth="2.4" />
      <path d={WARD_BELT} stroke={p.ink.light} strokeOpacity="0.7" strokeWidth="1.1" />

      {/* 顶沿倒角的受光边。 */}
      <path d={WARD_LIT} stroke={p.ink.light} strokeOpacity="0.75" strokeWidth="1.3" />

      {/* 菱心四向刻线: 把核心钉在盾面上(培育完成那六道指针的同一手法)。画在核心之前, 端头被压住。 */}
      <g stroke={p.ink.accent} strokeOpacity="0.7" strokeWidth="1.4">
        {WARD_PINS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* 盾心: 菱形核心正压在腰线上, 把上下两段缝住; 内菱是白蓝爆点的边界。 */}
      <path d={WARD_CORE} fill={paint(uid, "core")} stroke={p.ink.deep} strokeWidth="1.4" />
      <path d={WARD_CORE_INNER} fill="none" stroke={p.ink.light} strokeOpacity="0.7" strokeWidth="1" />

      {/* 双肩两枚铆钉: 暗座 + 亮心 + 高光 —— 铆钉是凸起的金属件, 平涂一个圆点看着像脏点。 */}
      <g>
        {WARD_RIVETS.map((rivet) => (
          <g key={rivet.key}>
            <circle cx={rivet.x} cy={rivet.y} r="2.6" fill={p.ink.deep} opacity="0.85" />
            <circle cx={rivet.x} cy={rivet.y} r="1.9" fill={p.ink.accent} />
            <circle cx={rivet.x - 0.6} cy={rivet.y - 0.6} r="0.85" fill={p.ink.light} />
          </g>
        ))}
      </g>
    </CombatPlate>
  );
}

/**
 * 心眼 —— 上下两道大弧夹住一只横长的尖角眼。
 *
 * 三件形: 双弧(眉弧 / 承光弧) + 眼(外眶 + 内眶 + 虹膜) + 叶形竖瞳。
 * 亮点只有瞳心那一粒 ——「看透」的表达是**收**不是放, 一枚亮眼睛落在暗背景里,
 * 比满屏发光更像在盯着人。
 *
 * ★ 按培育两态的美学重排: 上一版给它配了额冠 + 四角睫线 + 上下轴线 + 虹膜内环 + 十二条纤维,
 *   "第三只眼"这件事被解释了五遍。这一版把配件并成上下两道大弧 —— 一件形同时干三件事:
 *   吃掉眼上下的空白、给这一枚自己的构成线(横向双弧夹一眼)、暗示"这不是一只普通眼睛"。
 * ★ 剪影不动 —— 三枚里唯一的横长主体, 且虹膜是正圆, 方向上自己就有对冲。
 * ★ 厚涂的活留下来的全是**大块**: 上睑投影(眼球"陷"进眼眶全靠它)、主副双高光(球感)、
 *   下眶反光。纤维从 12 条减到 8 条 —— 虹膜要有纹理, 但纹理不该被读成放射线。
 */
export function InsightEmblem({ className, label = "心眼" }: CombatEmblemProps): ReactElement {
  const uid = useSafeId();
  const p = INSIGHT_PALETTE;

  return (
    <CombatPlate uid={uid} palette={p} className={className} label={label}>
      {/* 上下两道大弧: 这一枚的构成线, 上亮下暗(同一个右上光源)。都不闭合 ——
          闭合就变成第二只眼眶了。 */}
      <path d={EYE_ARCS[0]} stroke={p.ink.accent} strokeOpacity="0.72" strokeWidth="2.2" />
      <path d={EYE_ARCS[1]} stroke={p.ink.accent} strokeOpacity="0.34" strokeWidth="2.2" />

      {/* 第一层 外眶: 暗底 + 一圈香槟金边。 */}
      <path d={EYE_OUTER} fill={p.ink.shade} stroke={p.ink.rim} strokeWidth="1.4" />

      {/* 第二层 内眶: 眼底渐变。 */}
      <path d={EYE_INNER} fill={paint(uid, "eye")} />

      {/* 上下睑弧: 上亮下暗, 眼眶因此有厚度。 */}
      <path d={EYE_LIDS[0]} stroke={p.ink.light} strokeOpacity="0.7" strokeWidth="1.2" />
      <path d={EYE_LIDS[1]} stroke={p.ink.deep} strokeOpacity="0.7" strokeWidth="1.4" />

      {/* 下眶环境反光: 把眼的下缘从近黑底盘上重新切出来。 */}
      <path d={EYE_BOUNCE} stroke={p.ink.bounce} strokeOpacity="0.55" strokeWidth="1.4" />

      {/* 第三层 虹膜。 */}
      <path d={EYE_IRIS} fill={paint(uid, "iris")} stroke={p.ink.deep} strokeWidth="1.3" />

      {/* 虹膜纤维: 8 条从瞳缘向外的短线。虹膜有纹理才有深度, 一块纯渐变只是个圆片。 */}
      <g stroke={p.ink.fiber} strokeOpacity="0.45" strokeWidth="1.1">
        {EYE_FIBER_ANGLES.map((deg) => (
          <path key={deg} d={EYE_FIBER} transform={`rotate(${deg} ${CENTER} ${CENTER})`} />
        ))}
      </g>

      {/* 上睑投影: 盖在眼球之上的一片暗。厚涂的主力 ——
          没有它, 三层同心画完眼球仍是"贴在眼眶上的一张纸"。 */}
      <path d={EYE_LID_SHADOW} fill={p.ink.deep} opacity="0.34" />

      {/* 叶形竖瞳 + 瞳心透光。整枚图标唯一的亮点, 只有针尖大。 */}
      <path d={EYE_PUPIL} fill={p.ink.deep} stroke={p.ink.light} strokeOpacity="0.7" strokeWidth="0.8" />
      <circle cx={CENTER} cy={CENTER} r="3.4" fill={paint(uid, "core")} />

      {/* 主高光弧(右上) + 副高光点(左下): 两点连起来眼球才是球, 只给一点就是个圆。 */}
      <path d={EYE_GLEAM} stroke={p.ink.light} strokeOpacity="0.85" strokeWidth="1.5" />
      <circle
        cx={EYE_GLEAM_MINOR.x}
        cy={EYE_GLEAM_MINOR.y}
        r={EYE_GLEAM_MINOR.r}
        fill={p.ink.light}
        opacity="0.4"
      />
    </CombatPlate>
  );
}
