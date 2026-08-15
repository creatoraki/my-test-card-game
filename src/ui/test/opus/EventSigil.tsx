import type { ReactElement } from "react";
import type { EventKind } from "./eventData";
import s from "./EventSigil.module.css";

// 事件徽记 —— 用 SVG 现画的事件示意图, 顶掉「贴一张位图」的做法。
//
// ★ 为什么是几何线稿而不是插画: 事件面板要的是**一眼认出这是哪类事件**, 不是看图。
//   线稿只用描边和圆弧, 颜色全部继承 currentColor(= 面板的事件主色), 换类型即换色, 不需要三份素材。
// ★ 母题统一: 三张图共用同一套「场域」底(同心刻度环 + 缓转虚线环 + 中心柔光),
//   差异只在中央的核心图形。这样切换事件时底盘不动、核心变形, 读起来是同一台仪器在换显示内容。
// ⚠ 所有动画都写在 CSS 里(不用 SMIL): 关掉动态效果时能被面板那条 prefers-reduced-motion 规则一并停掉。

const CENTER = 100;

/** 共用底盘: 刻度环 + 两圈反向缓转的虚线环 + 中心柔光。 */
function Field() {
  // 外圈刻度: 36 根短线, 每 10° 一根, 靠代码生成而不是手写 path。
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const angle = (i * Math.PI) / 18;
    const long = i % 3 === 0;
    const r1 = long ? 84 : 88;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return (
      <line
        key={i}
        x1={CENTER + cos * r1}
        y1={CENTER + sin * r1}
        x2={CENTER + cos * 92}
        y2={CENTER + sin * 92}
        opacity={long ? 0.5 : 0.22}
      />
    );
  });

  return (
    <g className={s.field}>
      <circle cx={CENTER} cy={CENTER} r="96" className={s.haze} />
      <g className={s.ticks} strokeWidth="1">
        {ticks}
      </g>
      <circle cx={CENTER} cy={CENTER} r="78" className={s.dashRing} />
      <circle cx={CENTER} cy={CENTER} r="66" className={s.dashRingBack} />
      {/* 一段游走的亮弧 —— 整张图里唯一「在转」的高亮, 负责让静态线稿活着。 */}
      <circle cx={CENTER} cy={CENTER} r="88" className={s.sweepArc} />
    </g>
  );
}

/** 生存: 阀轮 + 水面。 */
function SurvivalCore() {
  const spokes = [0, 60, 120, 180, 240, 300].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return (
      <line
        key={deg}
        x1={CENTER + Math.cos(rad) * 13}
        y1={CENTER + Math.sin(rad) * 13}
        x2={CENTER + Math.cos(rad) * 38}
        y2={CENTER + Math.sin(rad) * 38}
      />
    );
  });

  return (
    <g>
      {/* 阀轮: 双环 + 六辐, 缓慢正转。 */}
      <g className={s.spinSlow}>
        <circle cx={CENTER} cy={CENTER} r="40" strokeWidth="1.6" opacity="0.9" />
        <circle cx={CENTER} cy={CENTER} r="13" strokeWidth="1.6" />
        <g strokeWidth="1.4" opacity="0.75">
          {spokes}
        </g>
      </g>
      <circle cx={CENTER} cy={CENTER} r="4" className={s.coreDot} />

      {/* 水面: 三层正弦, 相位错开地平移。 */}
      <g className={s.waves} strokeWidth="1.4">
        <path className={s.wave1} d="M18 138q14-9 28 0t28 0 28 0 28 0 28 0 28 0" opacity="0.75" />
        <path className={s.wave2} d="M18 152q14-9 28 0t28 0 28 0 28 0 28 0 28 0" opacity="0.45" />
        <path className={s.wave3} d="M18 166q14-9 28 0t28 0 28 0 28 0 28 0 28 0" opacity="0.25" />
      </g>

      {/* 两滴下落的水。 */}
      <circle cx="72" cy="0" r="2.6" className={s.drop1} fill="currentColor" stroke="none" />
      <circle cx="128" cy="0" r="2" className={s.drop2} fill="currentColor" stroke="none" />
    </g>
  );
}

/** 成长: 向上生长的核心 + 一圈圈扩散出去的残响。 */
function GrowthCore() {
  // 左右两侧的成长刻度: 越往上越长。
  const bars = [0, 1, 2, 3].map((i) => (
    <g key={i} opacity={0.28 + i * 0.16}>
      <line x1={62 - i * 2} y1={130 - i * 16} x2={74} y2={130 - i * 16} />
      <line x1={126} y1={130 - i * 16} x2={138 + i * 2} y2={130 - i * 16} />
    </g>
  ));

  return (
    <g>
      {/* 残响: 同一个环放大三次, 依次淡出。 */}
      <g className={s.echoes}>
        <circle cx={CENTER} cy={CENTER} r="26" className={s.echo} style={{ animationDelay: "0s" }} />
        <circle cx={CENTER} cy={CENTER} r="26" className={s.echo} style={{ animationDelay: "1.4s" }} />
        <circle cx={CENTER} cy={CENTER} r="26" className={s.echo} style={{ animationDelay: "2.8s" }} />
      </g>

      {/* 核心: 一条向上的茎 + 两片对开的叶, 整体轻微呼吸。 */}
      <g className={s.breathe} strokeWidth="1.6">
        <path d="M100 142V72" opacity="0.9" />
        <path d="M100 112c-16 0-26-10-27-25 16-2 27 8 27 25z" opacity="0.85" />
        <path d="M100 100c16-2 27-12 27-27-16 0-27 10-27 27z" opacity="0.6" />
        <path d="M92 72q8-14 16 0" opacity="0.75" />
      </g>
      <circle cx={CENTER} cy="66" r="3.4" className={s.coreDot} />

      <g strokeWidth="1.3">{bars}</g>
    </g>
  );
}

/** 风险: 向下收束的井道 + 坠落物 + 三下敲击。 */
function RiskCore() {
  // 五层方框, 逐层缩小并旋转, 越靠内越亮 —— 平面上做出「往下看」的深度。
  const rings = [0, 1, 2, 3, 4].map((i) => {
    const size = 76 - i * 14;
    return (
      <rect
        key={i}
        x={CENTER - size / 2}
        y={CENTER - size / 2}
        width={size}
        height={size}
        rx="4"
        opacity={0.2 + i * 0.16}
        transform={`rotate(${i * 9} ${CENTER} ${CENTER})`}
      />
    );
  });

  return (
    <g>
      <g className={s.shaft} strokeWidth="1.4">
        {rings}
      </g>

      {/* 坠落的点 + 拖尾。 */}
      <g className={s.fall}>
        <line x1={CENTER} y1="46" x2={CENTER} y2="62" strokeWidth="1.2" opacity="0.5" />
        <circle cx={CENTER} cy="64" r="3" fill="currentColor" stroke="none" />
      </g>

      {/* 三下敲击: 三段同心弧依次亮起。 */}
      <g className={s.knocks} strokeWidth="1.5" opacity="0.85">
        <path className={s.knock} style={{ animationDelay: "0s" }} d="M76 42a34 34 0 0 1 48 0" />
        <path className={s.knock} style={{ animationDelay: "0.22s" }} d="M68 32a46 46 0 0 1 64 0" />
        <path className={s.knock} style={{ animationDelay: "0.44s" }} d="M60 22a58 58 0 0 1 80 0" />
      </g>
    </g>
  );
}

const CORES: Record<EventKind, () => ReactElement> = {
  survival: SurvivalCore,
  growth: GrowthCore,
  risk: RiskCore,
};

export function EventSigil({ kind }: { kind: EventKind }) {
  const Core = CORES[kind];
  return (
    <svg
      className={s.sigil}
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden
    >
      <Field />
      <g className={s.core}>
        <Core />
      </g>
    </svg>
  );
}
