// ★ BUFF 图标 v9「霓虹宝石徽章」★ —— ds 开发者的实现。
//
// 五个 1:1 自包含 SVG 图标(viewBox 0 0 128 128, 满幅圆角方框), 不依赖位图, 无任何文字:
//   · 培育植物(进行中) ——「萌发」: 裂壳种子, 嫩芽从裂缝探出, 2/3 进度弧 + 游标;
//   · 培育植物(完成)   ——「绽放」: 八瓣花冠(外层实瓣 + 内层错开 22.5° 小瓣),
//     满圈完成环 + 8 根环外指针 + 纹章托带;
//   · 锋利             ——「霓虹破甲箭镞」: 多面切割钢镞, 左右双面明暗 + 中央脊线,
//     血槽霓虹红线 + 尖端见血, 赤红收口宝石 + 套筒能量槽, 两侧漂浮能量碎片;
//   · 心眼             ——「圣辉全视之眼」: 三层三角嵌套 + 双层虹膜 + 旋转菱形双瞳,
//     顶点大菱形宝石 + 缎带托带, 七道长芒;
//   · 护盾             ——「辉光能量圆盾」: 四层同心 + 外环刻线 + 能量导管,
//     菱形盾心宝石 + 辉光环 + 双线力场弧 + 六枚能量节点。
//
// ★ v9 设计语言: 霓虹宝石徽章 —— 厚涂方框 + 多面切割 + 宝石核心 + 霓虹能量线 ★
//   · 外框: 五个图标共用同一套**满幅 1:1 圆角方框**(外沿暗环 / 底板 / 光池 / 内投影 /
//     三道描边), 内容一律裁进内沿 —— 压在任何背景上都不漏角, 零外溢;
//   · 厚涂: 主体都是「底色 / 暗面 / 亮边」三层叠在同一块形上 —— 半边高光路径
//     只描受光侧, 立体感来自明暗三档的相对关系, 而不是整圈描边;
//   · 宝石核心: 战斗三态各有一颗「宝石」(菱形 / 双菱 / 大菱形)收口,
//     白心爆点 + 内菱高光, 是各枚的亮度峰值;
//   · 霓虹能量线: 血槽红线 / 虹膜放射纹 / 盾面导管与刻线 —— 每枚只给一处点缀,
//     不抢主体;
//   · 光亮: 外发光滤镜(feGaussianBlur + feComponentTransfer)按配色控制半径与强度,
//     战斗三态比 v8 推高一档, 框内再叠一团光池 + 中央微热点 + 四边内投影,
//     主体「陷」在框里;
//   · 颜色: 五套独立复合配色(深靛褐绿 / 深赭金橙 / 冰蓝·霓虹红 / 深紫·金白 /
//     深蓝·霓虹青), 色相本身就是语义, 与盘底高对比;
//   · 构图: 战斗三态是**多层同心 + 双面切光 + 宝石核心 + 能量点缀**的厚涂拟物 ——
//     主体一律顶到框边, 缩到 20px 依然可读; 剪影(竖镞 / 尖三角 / 圆)与色相是区分线,
//     任意一条单独拿掉都还能认;
//   · 视角: 培育中「裂壳」是过程, 完成态「花冠纹章」是成果, 不靠文字也读得出先后。
//
// 语义对齐卡牌设定: 「培育 N」计数归零后卡面效果升级; 锋利(sharp)使攻击伤害 ×1.1;
// 心眼是卡牌实例标记; 护盾吸收伤害。
// ⚠ **战斗三态是静态图标**: 锋利 / 心眼 / 护盾 不收 animated 开关, 形靠多层同心 +
//   双面切光立住, 不靠动效撑; 只有培育两枚保留动画(全部写在 CSS, 不用 SMIL),
//   animated=false 与 prefers-reduced-motion 两条关停路径都要能生效。
// ⚠ defs 里的 id 必须逐实例唯一(useId): 同页并排多枚时, 重名 filter / gradient 会被
//   后挂载的那个顶掉, 表现为「其中一枚突然变黑或不发光」。
import { useId, type ReactElement, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import {
  ARROW_BLOOD_RUN,
  ARROW_BLOOD_TIP,
  ARROW_BOUNCE,
  ARROW_CORE,
  ARROW_EDGE_L,
  ARROW_EDGE_R,
  ARROW_FACE_L,
  ARROW_FACE_R,
  ARROW_FULLER,
  ARROW_FULLER_GLOW,
  ARROW_GEM,
  ARROW_GEM_HILITE,
  ARROW_GEM_INNER,
  ARROW_OUTER,
  ARROW_RAYS,
  ARROW_RIDGE,
  ARROW_SHARDS,
  ARROW_SOCKET,
  ARROW_SOCKET_GLOW,
  CENTER,
  COTYLEDON_LEFT,
  COTYLEDON_RIGHT,
  CRACK_PATH,
  CREST_BAND_PATH,
  EDGE_FRAME,
  EYE_APEX,
  EYE_APEX_HILITE,
  EYE_APEX_INNER,
  EYE_BANNER,
  EYE_BANNER_GEM,
  EYE_BANNER_LIT,
  EYE_CENTER,
  EYE_FIBERS,
  EYE_LID_SHADOW,
  EYE_PUPIL,
  EYE_PUPIL_INNER,
  EYE_RADIUS,
  EYE_RAYS,
  EYE_RING_RADIUS,
  EYE_TRI_BOUNCE,
  EYE_TRI_EDGE_L,
  EYE_TRI_EDGE_R,
  EYE_TRI_FACET_LIT,
  EYE_TRI_FACET_SHADE,
  EYE_TRI_MID,
  EYE_TRI_OUTER,
  GROWING_RATIO,
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
  PROGRESS_HEAD,
  RING_RADIUS,
  ROOT_PATHS,
  SEED_LIT_PATH,
  SEED_PATH,
  SHIELD_BOUNCE,
  SHIELD_BOSS,
  SHIELD_BOSS_INNER,
  SHIELD_CENTER,
  SHIELD_CONDUITS,
  SHIELD_FACET_LIT,
  SHIELD_FACET_SHADE,
  SHIELD_HALOS_INNER,
  SHIELD_HALOS_OUTER,
  SHIELD_RIM_LIT,
  SHIELD_RING,
  SHIELD_RIVETS,
  SHIELD_TICKS,
  SOCKET_RIVETS,
  SPROUT_STEM,
  SPROUT_TIP,
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

/**
 * 战斗三态(锋利 / 心眼 / 护盾)的 props —— 与培育两态不同:
 * **不收 animated**, 这三枚是静态图标, 形靠三层同心 + 切面明暗立住, 不靠动效撑。
 */
export type CombatBuffIconProps = {
  /** 外层布局类(这枚图标在自己的槽位里占多大)。图标外观一律由本组件持有。 */
  className?: string;
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
  /** 只对培育两态生效: 战斗三态是静态图标, 不传这一项, 组件也不会为它们造动效类。 */
  animated?: boolean;
  label?: string | null;
  children: ReactNode;
}): ReactElement {
  const glowId = `db-glow-${uid}`;
  const clipId = `db-clip-${uid}`;
  const poolId = `db-pool-${uid}`;
  const vigId = `db-vig-${uid}`;

  return (
    <svg
      className={cx(s.plate, animated === true && s.animated, className)}
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

      {/* 3~4 内容区: 光池 → 中央微热点 → 主体 → 内投影, 整组裁在内沿里。 */}
      <g clipPath={`url(#${clipId})`}>
        <circle className={s.aura} cx={CENTER} cy={CENTER} r="46" fill={`url(#${poolId})`} />
        {/* 中央微热点: 光池之上再叠一团更亮的中心光, 主体从盘心浮起来。 */}
        <circle cx={CENTER} cy={CENTER} r="22" fill="#ffffff" opacity="0.06" />
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
 * 锋利「霓虹破甲箭镞」—— 一枚多面切割的箭镞竖着吃满整个内沿。
 *
 * 五层结构: 外廓(带倒刺的暗钢剪影) → 左右两个主面(右受光 / 左背光) →
 * 内芯(亮钢), 层间靠近黑描边分开; 中央脊线一道白高光把两个面劈开。
 * 切面明暗: 右半受光(近白) / 左半背光(压暗), 明暗交界压在中央脊线上,
 * 左下外廓一道环境反光把暗面从底盘上切开。
 * 宝石核心: 血槽底口那枚赤红菱形宝石(外菱 + 内菱 + 高光点),
 * 同时压住血槽与套筒的接缝 —— 整枚唯一的暖色焦点。
 * 霓虹能量: 血槽内一道发光的红线 + 套筒能量槽线 + 两侧漂浮能量碎片。
 * 配件: 双侧倒刺 / 套筒 + 两枚能量节点 / 尖端与中腰四道射线。
 * 血: 尖端血渍(刚穿过去) → 沿血槽下淌的一道血流, 只在这两处。
 *
 * ★ 三枚里唯一的**竖长**剪影(心眼是尖三角、护盾是圆), 20px 下先读到这个长宽比。
 * ★ 血槽霓虹线与赤红宝石是「血」的两次出现: 冷钢与血红面积比约 10:1,
 *   血是落点不是主色。
 * ⚠ 画序有硬要求, 从下到上: 射线/碎片 → 外廓 → 左面 → 右面 → 内芯 → 脊线 →
 *   血槽 → 霓虹线 → 血 → 刃口亮边 → 反光 → 宝石 → 套筒 → 能量线 → 节点。
 *   血必须压在镞面之上、刃口亮边之下(血挂在镞上, 但盖不住刃口的锋);
 *   套筒最后画, 否则会看见镞身穿出套筒。
 */
export function SharpBuffIcon({ className, label = "锋利" }: CombatBuffIconProps): ReactElement {
  const uid = useSafeId();
  const p = SHARP_PALETTE;

  return (
    <BuffPlate uid={uid} palette={p} className={className} label={label}>
      {/* 锋芒射线 + 漂浮碎片: 画在最底下, 让它们看起来是从箭镞身后透出来的。 */}
      <g stroke={p.ink.accent} strokeOpacity="0.7" strokeWidth="1.2">
        {ARROW_RAYS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {ARROW_SHARDS.map((d) => (
        <path key={d} d={d} fill={p.ink.accent} fillOpacity="0.45" />
      ))}

      {/* 第一层 外廓: 暗钢 + 近黑描边, 带双侧倒刺的完整剪影。 */}
      <path d={ARROW_OUTER} fill={paint(uid, "outer")} stroke={p.ink.deep} strokeWidth="1.6" />

      {/* 第二层 左右主面: 右受光 / 左背光, 明暗交界压在中央脊线上。 */}
      <path d={ARROW_FACE_L} fill={paint(uid, "faceL")} />
      <path d={ARROW_FACE_R} fill={paint(uid, "faceR")} />

      {/* 第三层 内芯: 再推亮一档的亮钢。 */}
      <path d={ARROW_CORE} fill={paint(uid, "core")} />

      {/* 中央脊线高光: 一道细白线, 两个面的棱。 */}
      <path d={ARROW_RIDGE} stroke={p.ink.light} strokeOpacity="0.85" strokeWidth="1.1" />

      {/* 血槽: 暗凹槽 + 槽内霓虹红线(能量在流)。 */}
      <path d={ARROW_FULLER} fill={paint(uid, "fuller")} />
      <path
        d={ARROW_FULLER_GLOW}
        stroke={p.ink.bloodGlow}
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* 血: 尖端血渍 → 沿血槽下淌的血流。 */}
      <path d={ARROW_BLOOD_TIP} fill={paint(uid, "blood")} />
      <path d={ARROW_BLOOD_RUN} stroke={p.ink.blood} strokeOpacity="0.9" strokeWidth="1.6" />

      {/* 刃口: 左暗右白 —— 一冷一暗两个面, 白的这条是整枚图标的亮度峰值。
          压在血之上: 血挂在镞上, 但盖不住刃口的锋。 */}
      <path d={ARROW_EDGE_L} stroke={p.ink.shade} strokeOpacity="0.9" strokeWidth="1.2" />
      <path d={ARROW_EDGE_R} stroke={p.ink.light} strokeWidth="1.5" />

      {/* 左下环境反光: 背光面不死黑, 左缘才不会和底盘粘在一起。 */}
      <path d={ARROW_BOUNCE} stroke={p.ink.bounce} strokeOpacity="0.5" strokeWidth="1.4" />

      {/* 收口宝石: 宝石核心, 外菱 + 内菱 + 高光点, 压在血槽底口。 */}
      <path d={ARROW_GEM} fill={paint(uid, "gem")} stroke={p.ink.deep} strokeWidth="1.3" />
      <path
        d={ARROW_GEM_INNER}
        fill="none"
        stroke={p.ink.light}
        strokeOpacity="0.8"
        strokeWidth="0.9"
      />
      <circle cx={ARROW_GEM_HILITE.x} cy={ARROW_GEM_HILITE.y} r="1.4" fill={p.ink.light} />

      {/* 套筒: 箭杆接口 + 能量槽线 + 两枚能量节点, 最后画 —— 盖住外廓的底缘。 */}
      <path d={ARROW_SOCKET} fill={paint(uid, "socket")} stroke={p.ink.deep} strokeWidth="1.3" />
      <path d={ARROW_SOCKET_GLOW} stroke={p.ink.accent} strokeOpacity="0.75" strokeWidth="1" />
      {SOCKET_RIVETS.map((rivet) => (
        <g key={rivet.key}>
          <circle cx={rivet.x} cy={rivet.y} r="2.4" fill={p.ink.deep} opacity="0.8" />
          <circle cx={rivet.x} cy={rivet.y} r="1.7" fill={p.ink.accent} />
          <circle cx={rivet.x + 0.5} cy={rivet.y - 0.5} r="0.7" fill={p.ink.light} />
        </g>
      ))}
    </BuffPlate>
  );
}

/**
 * 心眼「圣辉全视之眼」—— 三层三角托一枚双层虹膜正圆, 占满画面。
 *
 * 三层同心: 外三角(暗底金边) → 中三角(金白渐变主体) → 双层虹膜正圆
 * (外金环 + 内白环), 层间靠近黑描边分开 —— 眼不是贴在三角上的, 是嵌在三角里的。
 * 切面明暗: 中三角沿中线劈成两半 —— 右半受光 / 左半背光, 金字塔的两面;
 * 左下内沿一道环境反光把背光面从底盘上重新切出来。
 * 宝石核心: 顶点大菱形宝石(外菱 + 内菱 + 高光点) + 旋转嵌套双菱瞳孔
 * (竖菱 + 45° 错开的内菱)。
 * 霓虹能量: 虹膜 8 条放射纹 + 瞳心白点透光, 整枚唯一亮点。
 * 配件: 七道长短交替光芒射线 / 上睑投影(新月形, 眼球「陷」进眼眶全靠它) /
 * 底部托带 + 中央小菱。
 *
 * ★ 三枚里唯一的**尖三角**剪影(锋利是竖镞、护盾是圆), 且虹膜是正圆 ——
 *   尖三角配正圆, 方向上自己就有对冲。
 * ★ 金白主题色: 金负责"贵"、白负责"亮", 与培育完成的暖橙金靠底盘明度与白的占比分开。
 * ⚠ 画序: 射线 → 外三角 → 中三角 → 切面 → 边缘 → 虹膜外环 → 虹膜内环 → 放射纹 →
 *   上睑投影 → 瞳孔双菱 → 瞳心 → 顶点宝石 → 托带。上睑投影必须盖在虹膜之上,
 *   瞳心透光最后亮起来。
 */
export function MindEyeBuffIcon({ className, label = "心眼" }: CombatBuffIconProps): ReactElement {
  const uid = useSafeId();
  const p = MIND_PALETTE;

  return (
    <BuffPlate uid={uid} palette={p} className={className} label={label}>
      {/* 光芒射线: 七道, 画在最底下, 从三角四周向外放射。 */}
      <g stroke={p.ink.accent} strokeOpacity="0.7" strokeWidth="1.2">
        {EYE_RAYS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* 第一层 外三角: 暗底 + 一圈金边。 */}
      <path d={EYE_TRI_OUTER} fill={p.ink.shade} stroke={p.ink.rim} strokeWidth="1.6" />

      {/* 第二层 中三角(眼底主体): 金白渐变 + 左右两道切面。 */}
      <path d={EYE_TRI_MID} fill={paint(uid, "triMid")} />
      <path d={EYE_TRI_FACET_LIT} fill={paint(uid, "facetLit")} />
      <path d={EYE_TRI_FACET_SHADE} fill={paint(uid, "facetShade")} />

      {/* 边缘: 左暗右亮, 三角因此有体积; 左下环境反光把背光面从底盘上切开。 */}
      <path d={EYE_TRI_EDGE_L} stroke={p.ink.deep} strokeOpacity="0.85" strokeWidth="1.2" />
      <path d={EYE_TRI_EDGE_R} stroke={p.ink.light} strokeOpacity="0.8" strokeWidth="1.2" />
      <path d={EYE_TRI_BOUNCE} stroke={p.ink.bounce} strokeOpacity="0.5" strokeWidth="1.4" />

      {/* 第三层 虹膜外环: 正圆, 与尖三角形成方向对冲。 */}
      <circle
        cx={EYE_CENTER.x}
        cy={EYE_CENTER.y}
        r={EYE_RADIUS}
        fill={paint(uid, "iris")}
        stroke={p.ink.deep}
        strokeWidth="1.3"
      />

      {/* 虹膜内环: 再推亮一档的白金 —— 双层环的亮度差让眼球「鼓」起来。 */}
      <circle
        cx={EYE_CENTER.x}
        cy={EYE_CENTER.y}
        r={EYE_RING_RADIUS}
        fill={paint(uid, "irisInner")}
      />

      {/* 虹膜放射纹: 8 条从内白环缘向金环外沿 —— 虹膜有纹理才有深度,
          一块纯渐变只是个圆片。 */}
      <g stroke={p.ink.fiber} strokeOpacity="0.65" strokeWidth="1">
        {EYE_FIBERS.map((fiber) => (
          <line key={fiber.key} x1={fiber.x1} y1={fiber.y1} x2={fiber.x2} y2={fiber.y2} />
        ))}
      </g>

      {/* 上睑投影: 虹膜上半的新月形暗片 —— 眼球"陷"进眼眶全靠这一片。 */}
      <path d={EYE_LID_SHADOW} fill={p.ink.deep} opacity="0.32" />

      {/* 瞳孔: 旋转嵌套双菱(竖菱 + 45° 错开内菱) + 瞳心白点。 */}
      <path
        d={EYE_PUPIL}
        fill={p.ink.deep}
        stroke={p.ink.light}
        strokeOpacity="0.7"
        strokeWidth="0.8"
      />
      <path d={EYE_PUPIL_INNER} fill={paint(uid, "pupilGlow")} />
      <circle cx={EYE_CENTER.x} cy={EYE_CENTER.y} r="1.8" fill={p.ink.light} />

      {/* 顶点宝石: 大菱形收口, 压住外三角的顶点。 */}
      <path d={EYE_APEX} fill={paint(uid, "apex")} stroke={p.ink.deep} strokeWidth="1" />
      <path
        d={EYE_APEX_INNER}
        fill="none"
        stroke={p.ink.light}
        strokeOpacity="0.8"
        strokeWidth="0.9"
      />
      <circle cx={EYE_APEX_HILITE.x} cy={EYE_APEX_HILITE.y} r="1.2" fill={p.ink.light} />

      {/* 底部托带 + 上缘亮边 + 中央小菱: 把三角钉在框上, 收掉下端空白。 */}
      <path d={EYE_BANNER} fill={paint(uid, "banner")} stroke={p.ink.deep} strokeWidth="1" />
      <path d={EYE_BANNER_LIT} stroke={p.ink.light} strokeOpacity="0.55" strokeWidth="1" />
      <path d={EYE_BANNER_GEM} fill={p.ink.light} opacity="0.9" />
    </BuffPlate>
  );
}

/**
 * 护盾「辉光能量圆盾」—— 一面占满画面的正面圆盾, 四层同心, 盾心一枚菱形宝石。
 *
 * 四层同心: 外环(暗底金属环 + 12 段刻线 + 霓虹细环) → 盾面(中亮) → 内盘(最亮) →
 * 盾心宝石(爆点), 每层之间留 9~11, 边缘因此有四道明暗交替 —— 圆盾天然就是同心嵌套。
 * 切面明暗: 盾面上缘一道受光月牙 + 左半背光切面, 明暗交界压在中线上;
 * 外环右上受光弧 + 左下环境反光, 金属环的「被敲打过」感。
 * 宝石核心: 盾心大菱形宝石(外菱 + 内菱 + 白心 + 辉光环), 棱角与盾同构。
 * 霓虹能量: 外环细环 + 刻线, 盾面四根能量导管, 力场光弧双线(细外弧 + 粗内弧)。
 * 配件: 圆周六枚能量节点(暗座 + 亮心 + 高光 + 外圈细环)。
 *
 * ★ 五枚里体量最大的一枚 —— 护盾要的就是一块压得住的实体, 这是它和另外两枚最快的区分。
 * ★ 三枚里唯一带弧的主体(圆 + 双侧光弧), 20px 下有弧 / 无弧比盾里画了什么快得多。
 * ⚠ 画序: 光弧 → 外环 → 细环 → 刻线 → 受光弧 + 反光 → 盾面 → 切面 → 导管 →
 *   内盘 → 辉光环 → 盾心宝石 → 能量节点。节点最后画, 暗座 + 亮心 + 高光三件缺一不可。
 */
export function ShieldBuffIcon({ className, label = "护盾" }: CombatBuffIconProps): ReactElement {
  const uid = useSafeId();
  const p = SHIELD_PALETTE;

  return (
    <BuffPlate uid={uid} palette={p} className={className} label={label}>
      {/* 双侧力场光弧(双线): 画在盾之前, 让它看起来是从盾后透出来的。 */}
      <g stroke={p.glow.color} strokeOpacity="0.8" strokeWidth="1.2">
        {SHIELD_HALOS_OUTER.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g stroke={p.ink.energy} strokeOpacity="0.5" strokeWidth="2.2">
        {SHIELD_HALOS_INNER.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* 第一层 外环: 暗底金属环 + 近黑描边。 */}
      <circle
        cx={SHIELD_CENTER.x}
        cy={SHIELD_CENTER.y}
        r={SHIELD_RING.outer}
        fill={paint(uid, "rim")}
        stroke={p.ink.deep}
        strokeWidth="1.5"
      />

      {/* 外环霓虹细环线 + 12 段刻线: 仪表盘式的科技感, 刻线与节点错开 15°。 */}
      <circle
        cx={SHIELD_CENTER.x}
        cy={SHIELD_CENTER.y}
        r={SHIELD_RING.outer - 5.5}
        fill="none"
        stroke={p.ink.accent}
        strokeOpacity="0.45"
        strokeWidth="1.1"
      />
      <g stroke={p.ink.accent} strokeOpacity="0.6" strokeWidth="1.2">
        {SHIELD_TICKS.map((tick) => (
          <line key={tick.key} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />
        ))}
      </g>

      {/* 外环右上受光弧 + 左下环境反光: 暗环不能死黑, 金属环才有厚度。 */}
      <path d={SHIELD_RIM_LIT} stroke={p.ink.light} strokeOpacity="0.75" strokeWidth="1.4" />
      <path d={SHIELD_BOUNCE} stroke={p.ink.bounce} strokeOpacity="0.55" strokeWidth="1.6" />

      {/* 第二层 盾面: 主渐变, 上亮下暗。 */}
      <circle
        cx={SHIELD_CENTER.x}
        cy={SHIELD_CENTER.y}
        r={SHIELD_RING.face}
        fill={paint(uid, "face")}
      />

      {/* 切面明暗: 上缘受光月牙 + 左半背光 —— 金属靠「面」分明暗, 不靠一条渐变糊过去。 */}
      <path d={SHIELD_FACET_LIT} fill={paint(uid, "facetLit")} />
      <path d={SHIELD_FACET_SHADE} fill={paint(uid, "facetShade")} />

      {/* 能量导管: 上下左右四根, 从内盘缘连到盾面缘 —— 能量在盾里流动。 */}
      <g stroke={p.ink.energy} strokeOpacity="0.55" strokeWidth="1.2">
        {SHIELD_CONDUITS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* 第三层 内盘: 再推亮一档并描一圈亮边, 做出「盾上还嵌着一面小盾」。 */}
      <circle
        cx={SHIELD_CENTER.x}
        cy={SHIELD_CENTER.y}
        r={SHIELD_RING.inner}
        fill={paint(uid, "innerShield")}
        stroke={p.ink.light}
        strokeOpacity="0.4"
        strokeWidth="1"
      />

      {/* 盾心辉光环: 宝石外一圈霓虹青细环。 */}
      <circle
        cx={SHIELD_CENTER.x}
        cy={SHIELD_CENTER.y}
        r="15"
        fill="none"
        stroke={p.ink.energy}
        strokeOpacity="0.65"
        strokeWidth="1.2"
      />

      {/* 盾心宝石: 菱形核心(外菱 + 内菱) + 白心爆点 + 微光晕。 */}
      <path d={SHIELD_BOSS} fill={paint(uid, "core")} stroke={p.ink.deep} strokeWidth="1.3" />
      <path
        d={SHIELD_BOSS_INNER}
        fill="none"
        stroke={p.ink.light}
        strokeOpacity="0.85"
        strokeWidth="0.9"
      />
      <circle cx={SHIELD_CENTER.x} cy={SHIELD_CENTER.y} r="2.2" fill={p.ink.light} />
      <circle cx={SHIELD_CENTER.x} cy={SHIELD_CENTER.y} r="5" fill={p.ink.light} opacity="0.35" />

      {/* 六枚能量节点: 暗座 + 亮心 + 高光 + 外圈细环 —— 凸起的金属件, 平涂一个圆点像脏点。 */}
      <g>
        {SHIELD_RIVETS.map((rivet) => (
          <g key={rivet.key}>
            <circle cx={rivet.x} cy={rivet.y} r="2.6" fill={p.ink.deep} opacity="0.85" />
            <circle cx={rivet.x} cy={rivet.y} r="1.9" fill={p.ink.accent} />
            <circle cx={rivet.x + 0.6} cy={rivet.y - 0.6} r="0.9" fill={p.ink.light} />
            <circle
              cx={rivet.x}
              cy={rivet.y}
              r="3.6"
              fill="none"
              stroke={p.ink.energy}
              strokeOpacity="0.35"
              strokeWidth="0.8"
            />
          </g>
        ))}
      </g>
    </BuffPlate>
  );
}
