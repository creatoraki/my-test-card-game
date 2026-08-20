import { useId, type ReactElement, type ReactNode } from "react";
import s from "./PlantCultivationBuffDemo.module.css";
import {
  BUFF_CENTER,
  BUFF_FRAME,
  BUFF_INNER_FRAME,
  BUFF_INNER_LINE,
  BUFF_INNER_SHADE,
  BUFF_OUTER_FRAME,
  BUFF_VIEWBOX,
  EYE_BRACKET_PATHS,
  EYE_CROSSHAIR_PATH,
  EYE_INNER_PATH,
  EYE_IRIS_INNER_PATH,
  EYE_IRIS_PATH,
  EYE_LENS_HIGHLIGHT_PATH,
  EYE_LOWER_SHELL_PATH,
  EYE_OUTER_PATH,
  EYE_PUPIL_PATH,
  EYE_RADIAL_TICKS,
  EYE_UPPER_SHELL_PATH,
  FRAME_DIAGONAL_PATH,
  FRAME_TICK_PATH,
  SHARP_BLADE_PATH,
  SHARP_BEVEL_PATH,
  SHARP_EDGE_PATH,
  SHARP_FULLER_PATH,
  SHARP_GRIP_BAND_PATH,
  SHARP_GRIP_PATH,
  SHARP_GUARD_PATH,
  SHARP_NOTCH_PATHS,
  SHARP_RADIANT_LINES,
  SHARP_RICASSO_PATH,
  SHIELD_ARC_PATHS,
  SHIELD_CORE_CROSS_PATH,
  SHIELD_CORE_INNER_PATH,
  SHIELD_CORE_PATH,
  SHIELD_DIAGONAL_VEIN_PATHS,
  SHIELD_INNER_LIT_PATH,
  SHIELD_INNER_PATH,
  SHIELD_OUTER_FACE_PATH,
  SHIELD_OUTER_PATH,
  SHIELD_RIVET_POINTS,
  SHIELD_SIDE_SHADE_PATH,
  SHIELD_VERTICAL_VEIN_PATH,
} from "./buffIconGeometry";
import { INSIGHT_PALETTE, SHARP_PALETTE, SHIELD_PALETTE, type BuffGradient, type BuffPalette } from "./buffIconPalette";

interface BuffIconFrameProps {
  title: string;
  description: string;
  accent: string;
  paper: string;
  children: ReactNode;
}

function useSafeId(): string {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

function paint(uid: string, key: string): string {
  return `url(#pb-${uid}-${key})`;
}

function GradientDefs({ uid, gradients }: { uid: string; gradients: BuffGradient[] }): ReactElement {
  return (
    <>
      {gradients.map((gradient) => {
        const stops = gradient.stops.map((stop) => (
          <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
        ));

        if (gradient.kind === "radial") {
          return (
            <radialGradient
              key={gradient.key}
              id={`pb-${uid}-${gradient.key}`}
              cx={gradient.cx}
              cy={gradient.cy}
              r={gradient.r}
            >
              {stops}
            </radialGradient>
          );
        }

        return (
          <linearGradient
            key={gradient.key}
            id={`pb-${uid}-${gradient.key}`}
            x1={gradient.x1}
            y1={gradient.y1}
            x2={gradient.x2}
            y2={gradient.y2}
          >
            {stops}
          </linearGradient>
        );
      })}
    </>
  );
}

function BuffIconFrame({ title, description, accent, paper, children }: BuffIconFrameProps): ReactElement {
  const frame = "M40 10H216L246 40V216L216 246H40L10 216V40Z";
  const innerFrame = "M47 22H209L234 47V209L209 234H47L22 209V47Z";

  return (
    <svg className={s.icon} viewBox="0 0 256 256" role="img" aria-label={title}>
      <desc>{description}</desc>
      <path d={frame} fill="#1e2923" />
      <path d={innerFrame} fill={paper} stroke="#f7e8c2" strokeWidth="4" />
      <path d="M59 44H197L212 59V197L197 212H59L44 197V59Z" fill="none" stroke="#29382e" strokeOpacity="0.5" strokeWidth="2" />
      <path d="M64 54H192L202 64V192L192 202H64L54 192V64Z" fill="none" stroke={accent} strokeOpacity="0.62" strokeWidth="5" strokeDasharray="1 12" strokeLinecap="round" />
      <path d="M57 76L76 57H180L199 76" fill="none" stroke="#fff4d2" strokeOpacity="0.7" strokeWidth="3" />
      <path d="M57 180L76 199H180L199 180" fill="none" stroke="#26352b" strokeOpacity="0.42" strokeWidth="2" />
      {children}
      <path d="M91 222H165" stroke="#26352b" strokeLinecap="round" strokeWidth="3" />
      <circle cx="64" cy="64" r="4" fill={accent} />
      <circle cx="192" cy="192" r="3" fill={accent} />
    </svg>
  );
}

function OpusBuffIconFrame({ title, description, palette, children }: { title: string; description: string; palette: BuffPalette; children: (uid: string) => ReactNode }): ReactElement {
  const uid = useSafeId();
  const glowId = `pb-glow-${uid}`;
  const clipId = `pb-clip-${uid}`;
  const poolId = `pb-pool-${uid}`;
  const vignetteId = `pb-vignette-${uid}`;

  return (
    <svg
      className={`${s.icon} ${s.animated}`}
      viewBox={`0 0 ${BUFF_VIEWBOX} ${BUFF_VIEWBOX}`}
      role="img"
      aria-label={title}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <desc>{description}</desc>
      <defs>
        <filter id={glowId} x="-24%" y="-24%" width="148%" height="148%">
          <feGaussianBlur stdDeviation="1.25" result="blur" />
          <feComponentTransfer in="blur" result="soft">
            <feFuncA type="linear" slope="0.72" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="soft" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={clipId}>
          <path d={BUFF_INNER_FRAME} />
        </clipPath>
        <GradientDefs uid={uid} gradients={palette.gradients} />
        <radialGradient id={poolId} cx="50%" cy="45%" r="62%">
          <stop offset="0%" stopColor={palette.glow.color} stopOpacity={palette.glow.opacity * 0.34} />
          <stop offset="56%" stopColor={palette.glow.color} stopOpacity={palette.glow.opacity * 0.12} />
          <stop offset="100%" stopColor={palette.glow.color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={vignetteId} cx="50%" cy="46%" r="66%">
          <stop offset="54%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      <path d={BUFF_FRAME} fill="#05070d" stroke="#000" strokeOpacity="0.72" strokeWidth="2" />
      <path d={BUFF_OUTER_FRAME} fill={paint(uid, "plate")} />

      <g clipPath={`url(#${clipId})`}>
        <circle className={s.aura} cx={BUFF_CENTER} cy={BUFF_CENTER} r="48" fill={`url(#${poolId})`} />
        <g filter={`url(#${glowId})`}>{children(uid)}</g>
        <path d={BUFF_INNER_FRAME} fill={`url(#${vignetteId})`} />
      </g>

      <path d={BUFF_INNER_SHADE} stroke="#000" strokeOpacity="0.58" strokeWidth="1.5" />
      <path d={BUFF_INNER_LINE} stroke={palette.rim} strokeOpacity="0.34" strokeWidth="0.8" />
      <path d={BUFF_OUTER_FRAME} stroke={palette.rim} strokeOpacity="0.92" strokeWidth="1.35" />
      <g stroke={palette.rim} strokeOpacity="0.46" strokeWidth="0.8">
        <path d={FRAME_TICK_PATH} />
        <path d={FRAME_DIAGONAL_PATH} />
      </g>
      <path d="M45 116H83" stroke={palette.rim} strokeOpacity="0.42" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="1.7" fill={palette.glow.color} />
      <circle cx="112" cy="112" r="1.35" fill={palette.glow.color} />
    </svg>
  );
}

export function CultivationProgressIcon() {
  return <BuffIconFrame title="培育植物进行中" description="一枚植物标本印章中的新芽与未完成进度环" accent="#b96b4b" paper="#e8dfc2">
    <circle cx="128" cy="128" r="65" fill="#d0c39e" stroke="#29382e" strokeWidth="3" />
    <path d="M69 128A59 59 0 0 1 187 128" fill="none" stroke="#f5e9c9" strokeWidth="8" strokeDasharray="246 371" strokeLinecap="round" />
    <path d="M128 175C126 151 126 128 129 101" fill="none" stroke="#29382e" strokeLinecap="round" strokeWidth="8" />
    <path d="M129 126C113 114 106 99 109 82C128 85 136 101 129 126Z" fill="#6f8d55" stroke="#29382e" strokeLinejoin="round" strokeWidth="3" />
    <path d="M130 119C143 106 155 101 169 104C166 121 152 132 130 130Z" fill="#9caf67" stroke="#29382e" strokeLinejoin="round" strokeWidth="3" />
    <path d="M128 177C115 166 104 163 92 165M128 181C141 170 152 168 164 170" fill="none" stroke="#29382e" strokeLinecap="round" strokeWidth="4" />
    <path d="M89 184C100 176 111 179 119 185C125 190 133 190 141 185C150 179 160 178 167 184" fill="none" stroke="#b96b4b" strokeWidth="7" />
    <circle cx="129" cy="102" r="5" fill="#f5e9c9" stroke="#29382e" strokeWidth="2" />
  </BuffIconFrame>;
}

export function CultivationCompleteIcon() {
  return <BuffIconFrame title="培育植物已完成" description="一枚植物标本印章中的盛放花冠与完成标记" accent="#bf8a35" paper="#eadab0">
    <circle cx="128" cy="128" r="65" fill="#d0b66e" stroke="#29382e" strokeWidth="3" />
    <circle cx="128" cy="128" r="59" fill="none" stroke="#f7e8c2" strokeWidth="8" />
    <g fill="#a65c45" stroke="#29382e" strokeLinejoin="round" strokeWidth="3">
      <path d="M128 126C99 111 91 88 105 70C126 77 135 96 128 126Z" />
      <path d="M128 126C104 98 110 75 130 67C143 88 139 108 128 126Z" />
      <path d="M128 126C126 94 143 78 164 82C166 106 149 121 128 126Z" />
      <path d="M128 126C155 110 176 117 181 137C160 148 141 139 128 126Z" />
      <path d="M128 126C151 142 151 164 133 176C117 158 117 140 128 126Z" />
      <path d="M128 126C103 145 84 137 78 117C99 106 117 113 128 126Z" />
    </g>
    <circle cx="128" cy="126" r="19" fill="#f2df9e" stroke="#29382e" strokeWidth="4" />
    <circle cx="128" cy="126" r="7" fill="#bf8a35" />
    <path d="M92 193C106 183 116 186 128 193C140 186 150 183 164 193" fill="none" stroke="#29382e" strokeLinecap="round" strokeWidth="5" />
    <g fill="#f7e8c2" stroke="#29382e" strokeWidth="2">
      <circle cx="188" cy="174" r="15" />
      <path d="M181 174L186 179L196 168" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    </g>
  </BuffIconFrame>;
}

export function InsightBuffIcon() {
  const palette = INSIGHT_PALETTE;

  return (
    <OpusBuffIconFrame title="心眼" description="聚焦的机械眼纹章，代表洞察与破隐" palette={INSIGHT_PALETTE}>
      {(uid) => (
        <>
          <g className={s.insightEye}>
            <path d={EYE_OUTER_PATH} fill={palette.darkInk} stroke={palette.rim} strokeOpacity="0.55" strokeWidth="1.4" />
            <path d={EYE_UPPER_SHELL_PATH} fill={paint(uid, "eyeShell")} opacity="0.92" />
            <path d={EYE_LOWER_SHELL_PATH} fill={palette.midInk} opacity="0.88" />
            <path d={EYE_INNER_PATH} fill={paint(uid, "iris")} stroke={palette.lightInk} strokeOpacity="0.82" strokeWidth="1.2" />
            <path d={EYE_IRIS_PATH} fill="none" stroke={palette.rim} strokeOpacity="0.58" strokeWidth="1.3" />
            <path d={EYE_IRIS_INNER_PATH} fill={paint(uid, "pupil")} stroke={palette.darkInk} strokeWidth="1.1" />
            <path d={EYE_PUPIL_PATH} fill={palette.darkInk} stroke={palette.lightInk} strokeOpacity="0.82" strokeWidth="0.8" />
            <path d={EYE_LENS_HIGHLIGHT_PATH} fill="none" stroke={palette.lightInk} strokeOpacity="0.95" strokeWidth="1.8" />
            <circle className={s.insightCore} cx="61" cy="59" r="2.2" fill={palette.lightInk} />
          </g>
          <g className={s.insightTicks} stroke={palette.rim} strokeOpacity="0.78" strokeWidth="1.1">
            {EYE_RADIAL_TICKS.map((tick) => (
              <line key={tick.key} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />
            ))}
          </g>
          <g className={s.insightRay} stroke={palette.lightInk} strokeOpacity="0.82" strokeWidth="1.2">
            <path d={EYE_BRACKET_PATHS.join(" ")} />
          </g>
          <path d={EYE_CROSSHAIR_PATH} stroke={palette.lightInk} strokeOpacity="0.28" strokeWidth="0.7" />
        </>
      )}
    </OpusBuffIconFrame>
  );
}

export function SharpnessBuffIcon() {
  const palette = SHARP_PALETTE;

  return (
    <OpusBuffIconFrame title="锋利" description="带有磨砺高光的斜向刃锋，代表锋利与贯穿" palette={SHARP_PALETTE}>
      {(uid) => (
        <>
          <g className={s.sharpBlade}>
            <path d={SHARP_BLADE_PATH} fill={paint(uid, "blade")} stroke={palette.darkInk} strokeWidth="1.8" />
            <path d={SHARP_BEVEL_PATH} fill={paint(uid, "bladeBevel")} opacity="0.92" />
            <path d={SHARP_FULLER_PATH} fill="none" stroke={palette.darkInk} strokeOpacity="0.66" strokeWidth="2.6" />
            <path className={s.sharpEdge} d={SHARP_EDGE_PATH} fill="none" stroke={palette.lightInk} strokeOpacity="0.9" strokeWidth="1.6" />
            <path d={SHARP_RICASSO_PATH} fill="none" stroke={palette.rim} strokeOpacity="0.7" strokeWidth="1.4" />
            <path d={SHARP_GUARD_PATH} fill="none" stroke={palette.midInk} strokeWidth="2.6" />
            <path d={SHARP_GRIP_PATH} fill="none" stroke={palette.darkInk} strokeWidth="3.2" />
            <path d={SHARP_GRIP_BAND_PATH} fill="none" stroke={palette.rim} strokeOpacity="0.72" strokeWidth="1" />
            <g stroke={palette.darkInk} strokeWidth="1.3">
              {SHARP_NOTCH_PATHS.map((path) => <path key={path} d={path} />)}
            </g>
          </g>
          <g className={s.sharpRay} stroke={palette.glow.color} strokeWidth="1.2">
            {SHARP_RADIANT_LINES.map((path) => <path key={path} d={path} />)}
          </g>
          <g className={s.sharpSpark}>
            <path d="M101 15L103 20L108 22L103 24L101 29L99 24L94 22L99 20Z" fill={palette.lightInk} stroke={palette.rim} strokeWidth="0.8" />
          </g>
        </>
      )}
    </OpusBuffIconFrame>
  );
}

export function ShieldBuffIcon() {
  const palette = SHIELD_PALETTE;

  return (
    <OpusBuffIconFrame title="护盾" description="具有内层能量和核心棱面的护盾纹章，代表层叠防护" palette={SHIELD_PALETTE}>
      {(uid) => (
        <>
          <g className={s.shield}>
            <path d={SHIELD_OUTER_PATH} fill={palette.darkInk} stroke={palette.rim} strokeOpacity="0.72" strokeWidth="1.6" />
            <path d={SHIELD_OUTER_FACE_PATH} fill={paint(uid, "shieldOuter")} />
            <path d={SHIELD_SIDE_SHADE_PATH} fill={palette.darkInk} opacity="0.3" />
            <path d={SHIELD_INNER_PATH} fill={paint(uid, "shieldFace")} stroke={palette.lightInk} strokeOpacity="0.84" strokeWidth="1.2" />
            <path d={SHIELD_INNER_LIT_PATH} fill="none" stroke={palette.lightInk} strokeOpacity="0.76" strokeWidth="1.3" />
            <path d={SHIELD_VERTICAL_VEIN_PATH} fill="none" stroke={palette.darkInk} strokeOpacity="0.58" strokeWidth="1.5" />
            <g stroke={palette.darkInk} strokeOpacity="0.64" strokeWidth="1.5">
              {SHIELD_DIAGONAL_VEIN_PATHS.map((path) => <path key={path} d={path} />)}
            </g>
            <path className={s.shieldCore} d={SHIELD_CORE_PATH} fill={paint(uid, "shieldCore")} stroke={palette.darkInk} strokeWidth="1.5" />
            <path d={SHIELD_CORE_INNER_PATH} fill="none" stroke={palette.lightInk} strokeOpacity="0.7" strokeWidth="1" />
            <path d={SHIELD_CORE_CROSS_PATH} fill="none" stroke={palette.midInk} strokeWidth="1.4" />
            <g className={s.shieldRivets}>
              {SHIELD_RIVET_POINTS.map((point) => (
                <g key={`${point.x}-${point.y}`}>
                  <circle cx={point.x} cy={point.y} r="2.2" fill={palette.darkInk} />
                  <circle cx={point.x - 0.45} cy={point.y - 0.45} r="0.8" fill={palette.lightInk} />
                </g>
              ))}
            </g>
          </g>
          <g className={s.shieldArc} stroke={palette.glow.color} strokeOpacity="0.9" strokeWidth="1.2">
            {SHIELD_ARC_PATHS.map((path) => <path key={path} d={path} />)}
          </g>
        </>
      )}
    </OpusBuffIconFrame>
  );
}
