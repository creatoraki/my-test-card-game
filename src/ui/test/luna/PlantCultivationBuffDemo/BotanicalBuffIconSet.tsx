import { useId, type ReactElement, type ReactNode } from "react";
import s from "./PlantCultivationBuffDemo.module.css";
import {
  BLOOM_ANGLES, BLOOM_CORE, BLOOM_CORE_INNER, BLOOM_ORBIT, BLOOM_PETAL, BLOOM_PETAL_EDGE, BLOOM_PETAL_SHADE,
  CENTER, CORNER_BOTANY, EYE_CROWN, EYE_GLEAM, EYE_INNER, EYE_IRIS, EYE_IRIS_RING, EYE_LIDS, EYE_OUTER, EYE_PUPIL,
  EYE_VEINS, FRAME, FRAME_TICKS, GROWING_GROUND, GROWING_GROUND_LIT, GROWING_POT, GROWING_POT_GLAZE,
  GROWING_POT_RIM, GROWING_POT_RIM_LIT, PLANT_LEAF_HILITES, PLANT_LEAF_LEFT, PLANT_LEAF_RIGHT, PLANT_NEW_BUD, PLANT_STEM,
  PLANT_TOP_BUD, SHIELD_CORE, SHIELD_CORE_INNER, SHIELD_FACE, SHIELD_HALOS,
  SHIELD_INNER, SHIELD_LIT, SHIELD_OUTER, SHIELD_RIVETS, SHIELD_VEINS, SHARP_CUT_PATHS, SHARP_GUARD, SHARP_GRIP, SHARP_GRIP_WRAP,
  SHARP_BLOOD_PATHS, SHARP_GUARD_INNER, SHARP_POMMEL, SHARP_PRISM_EDGE, SHARP_PRISM_FACET_PATH, SHARP_PRISM_PATH, SHARP_PRISM_SPINE, SHARP_RADIANT, SHARP_SLIVER_PATHS,
  SHARP_SPARK, SPROUT_STEM, INNER_FRAME, INNER_LINE,
  INNER_SHADE, OUTER_FRAME,
} from "./botanicalGeometry";
import { DONE_PALETTE, GROWING_PALETTE, INSIGHT_PALETTE, SHARP_PALETTE, SHIELD_PALETTE, type BuffGradient, type BuffPalette } from "./botanicalPalette";

function safeId(): string {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

function paint(uid: string, key: string): string {
  return `url(#pb-${uid}-${key})`;
}

function GradientDefs({ uid, gradients }: { uid: string; gradients: BuffGradient[] }): ReactElement {
  return (
    <>
      {gradients.map((gradient) => {
        const stops = gradient.stops.map((stop) => <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />);
        return gradient.kind === "radial" ? (
          <radialGradient key={gradient.key} id={`pb-${uid}-${gradient.key}`} cx={gradient.cx} cy={gradient.cy} r={gradient.r}>{stops}</radialGradient>
        ) : (
          <linearGradient key={gradient.key} id={`pb-${uid}-${gradient.key}`} x1={gradient.x1} y1={gradient.y1} x2={gradient.x2} y2={gradient.y2}>{stops}</linearGradient>
        );
      })}
    </>
  );
}

function BotanicalFrame({ title, description, palette, children }: { title: string; description: string; palette: BuffPalette; children: (uid: string) => ReactNode }): ReactElement {
  const uid = safeId();
  const clipId = `pb-clip-${uid}`;
  const glowId = `pb-glow-${uid}`;
  const haloId = `pb-halo-${uid}`;
  const vignetteId = `pb-vignette-${uid}`;

  return (
    <svg className={s.icon} viewBox="0 0 128 128" role="img" aria-label={title} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <desc>{description}</desc>
      <defs>
        <filter id={glowId} x="-24%" y="-24%" width="148%" height="148%">
          <feGaussianBlur stdDeviation={palette.glow.blur} result="blur" />
          <feComponentTransfer in="blur" result="soft"><feFuncA type="linear" slope={palette.glow.opacity} /></feComponentTransfer>
          <feMerge><feMergeNode in="soft" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={clipId}><path d={INNER_FRAME} /></clipPath>
        <GradientDefs uid={uid} gradients={palette.gradients} />
        <radialGradient id={haloId} cx="50%" cy="48%" r="62%">
          <stop offset="0%" stopColor={palette.glow.color} stopOpacity={palette.glow.opacity * 0.32} />
          <stop offset="58%" stopColor={palette.glow.color} stopOpacity={palette.glow.opacity * 0.1} />
          <stop offset="100%" stopColor={palette.glow.color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={vignetteId} cx="50%" cy="45%" r="68%"><stop offset="56%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.58" /></radialGradient>
      </defs>
      <path d={FRAME} fill="#050807" stroke="#000" strokeOpacity="0.8" strokeWidth="2" />
      <path d={OUTER_FRAME} fill={paint(uid, "paper")} />
      <g clipPath={`url(#${clipId})`}>
        <circle className={s.aura} cx={CENTER} cy={CENTER} r="48" fill={`url(#${haloId})`} />
        <path d="M29 64C36 37 51 24 64 24C77 24 92 37 99 64C92 91 77 104 64 104C51 104 36 91 29 64Z" stroke={palette.rim} strokeOpacity="0.14" strokeWidth="1" />
        <g filter={`url(#${glowId})`}>{children(uid)}</g>
        <path d={INNER_FRAME} fill={`url(#${vignetteId})`} />
      </g>
      <path d={INNER_SHADE} stroke="#000" strokeOpacity="0.65" strokeWidth="1.5" />
      <path d={INNER_LINE} stroke={palette.rim} strokeOpacity="0.38" strokeWidth="0.9" />
      <path d={OUTER_FRAME} stroke={palette.rim} strokeOpacity="0.92" strokeWidth="1.35" />
      <g className={s.frameBotany} stroke={palette.rim} strokeOpacity="0.58" strokeWidth="0.8">
        {[0, 90, 180, 270].map((angle) => <path key={angle} d={CORNER_BOTANY} transform={`rotate(${angle} 64 64)`} />)}
        <path d={FRAME_TICKS} />
      </g>
      <circle cx="17" cy="17" r="1.5" fill={palette.glow.color} /><circle cx="111" cy="111" r="1.5" fill={palette.glow.color} />
    </svg>
  );
}

export function CultivationProgressIcon(): ReactElement {
  const p = GROWING_PALETTE;
  return <BotanicalFrame title="培育植物进行中" description="月相标本盘中的小型幼株、培养盆与新叶芽点" palette={p}>{(uid) => <>
    <path className={s.growingGround} d={GROWING_GROUND} stroke={p.ink.track} strokeOpacity="0.8" strokeWidth="1.4" />
    <path d={GROWING_GROUND_LIT} stroke={p.ink.light} strokeOpacity="0.26" strokeWidth="0.8" />
    <g className={s.youngPlant}>
      <path d={PLANT_STEM} fill={paint(uid, "plant")} stroke={p.ink.deep} strokeWidth="1.1" />
      <path d={PLANT_LEAF_LEFT} fill={paint(uid, "plant")} stroke={p.ink.deep} strokeWidth="1.2" />
      <path d={PLANT_LEAF_RIGHT} fill={paint(uid, "plant")} stroke={p.ink.deep} strokeWidth="1.2" />
      <path d={PLANT_TOP_BUD} fill={paint(uid, "plant")} stroke={p.ink.deep} strokeWidth="1.2" />
      {PLANT_LEAF_HILITES.map((path) => <path key={path} d={path} stroke={p.ink.light} strokeOpacity="0.56" strokeWidth="0.85" />)}
      <circle className={s.plantCore} cx={PLANT_NEW_BUD.x} cy={PLANT_NEW_BUD.y} r="2.5" fill={paint(uid, "core")} />
    </g>
    <g className={s.growingPot}>
      <path d={GROWING_POT} fill={paint(uid, "pot")} stroke={p.ink.deep} strokeWidth="1.5" />
      <path d={GROWING_POT_RIM} fill={p.ink.shadow} stroke={p.ink.deep} strokeWidth="1.4" />
      <path d={GROWING_POT_RIM_LIT} stroke={p.ink.light} strokeOpacity="0.7" strokeWidth="1.1" />
      <path d={GROWING_POT_GLAZE} stroke={p.ink.light} strokeOpacity="0.23" strokeWidth="1" />
    </g>
  </>}</BotanicalFrame>;
}

export function CultivationCompleteIcon(): ReactElement {
  const p = DONE_PALETTE;
  return <BotanicalFrame title="培育植物已完成" description="月相标本盘中的盛放花冠与完成的闭合轨迹" palette={p}>{(uid) => <>
    <circle cx={CENTER} cy={CENTER} r="47" fill="none" stroke={p.ink.track} strokeWidth="2" /><path className={s.completionOrbit} d={BLOOM_ORBIT} stroke={p.ink.accent} strokeWidth="3.2" />
    <g className={s.completionBloom}>{BLOOM_ANGLES.map((angle) => <g key={angle} transform={`rotate(${angle} 64 64)`}>
      <path d={BLOOM_PETAL} fill={paint(uid, "petal")} stroke={p.ink.deep} strokeWidth="1.15" /><path d={BLOOM_PETAL_SHADE} fill={paint(uid, "petalShade")} opacity="0.7" /><path d={BLOOM_PETAL_EDGE} stroke={p.ink.light} strokeOpacity="0.7" strokeWidth="1" />
    </g>)}<path d={BLOOM_CORE} fill={paint(uid, "core")} stroke={p.ink.deep} strokeWidth="1.2" /><path d={BLOOM_CORE_INNER} fill={p.ink.light} opacity="0.8" /></g>
    <circle className={s.bloomCore} cx="64" cy="61" r="3" fill={paint(uid, "core")} />
  </>}</BotanicalFrame>;
}

export function InsightBuffIcon(): ReactElement {
  const p = INSIGHT_PALETTE;
  return <BotanicalFrame title="心眼" description="额心竖瞳天眼，金色眼眶与白色神光代表洞察弱点" palette={p}>{(uid) => <>
    <path d={EYE_CROWN} fill={p.ink.accent} opacity="0.68" /><g className={s.insightEye}>
      <path d={EYE_OUTER} fill={p.ink.shadow} stroke={p.rim} strokeWidth="1.4" /><path d={EYE_INNER} fill={paint(uid, "eye")} opacity="0.95" />
      {EYE_LIDS.map((path) => <path key={path} d={path} stroke={p.ink.light} strokeOpacity="0.7" strokeWidth="1.1" />)}<path d={EYE_IRIS} fill={paint(uid, "iris")} stroke={p.ink.deep} strokeWidth="1.3" /><path d={EYE_IRIS_RING} stroke={p.ink.light} strokeOpacity="0.62" strokeWidth="1" />
      <path d={EYE_PUPIL} fill={p.ink.deep} stroke={p.ink.light} strokeOpacity="0.8" strokeWidth="0.8" /><circle className={s.insightCore} cx="61" cy="60" r="2.4" fill={paint(uid, "core")} /><path d={EYE_GLEAM} stroke={p.ink.light} strokeWidth="1.5" />
    </g><g className={s.insightVeins} stroke={p.rim} strokeOpacity="0.72" strokeWidth="1">{EYE_VEINS.map((path) => <path key={path} d={path} />)}</g>
  </>}</BotanicalFrame>;
}

export function SharpnessBuffIcon(): ReactElement {
  const p = SHARP_PALETTE;
  return <BotanicalFrame title="锋利" description="一柄斜向染血匕首与贴近刀锋的斩击弧光组成的锋利标记，代表穿透与切断" palette={p}>{(uid) => <>
    <g className={s.sharpRadiance} fill="none" stroke={p.glow.color} strokeOpacity="0.52" strokeWidth="1.2">
      {SHARP_RADIANT.map((path) => <path key={path} d={path} />)}
    </g>
    <g className={s.sharpPrism}>
      <path d={SHARP_PRISM_PATH} fill={paint(uid, "blade")} stroke={p.ink.deep} strokeWidth="1.6" />
      <path d={SHARP_PRISM_FACET_PATH} fill={paint(uid, "facet")} opacity="0.78" />
      <path d={SHARP_PRISM_SPINE} stroke={p.ink.deep} strokeOpacity="0.82" strokeWidth="2" />
      <path className={s.sharpEdge} d={SHARP_PRISM_EDGE} stroke={p.ink.light} strokeOpacity="0.92" strokeWidth="1.5" />
    </g>
    <g className={s.sharpSlivers} fill={paint(uid, "facet")} stroke={p.ink.deep} strokeWidth="1.1" opacity="0.74">
      {SHARP_SLIVER_PATHS.map((path) => <path key={path} d={path} />)}
    </g>
    <g className={s.sharpBlood} fill={paint(uid, "blood")} stroke={p.ink.deep} strokeOpacity="0.58" strokeWidth="0.7">
      {SHARP_BLOOD_PATHS.map((path) => <path key={path} d={path} />)}
    </g>
    <g className={s.sharpCuts} stroke={p.ink.light} strokeOpacity="0.68" strokeWidth="1.1">
      {SHARP_CUT_PATHS.map((path) => <path key={path} d={path} />)}
    </g>
    <g className={s.sharpGrip}>
      <path d={SHARP_GUARD} fill={paint(uid, "guard")} stroke={p.ink.deep} strokeWidth="1.5" />
      <path d={SHARP_GUARD_INNER} fill={p.ink.deep} stroke={p.ink.light} strokeOpacity="0.52" strokeWidth="0.8" />
      <path d={SHARP_GRIP} fill={paint(uid, "grip")} stroke={p.ink.deep} strokeWidth="1.4" />
      {SHARP_GRIP_WRAP.map((path) => <path key={path} d={path} stroke={p.ink.light} strokeOpacity="0.42" strokeWidth="0.8" />)}
      <path d={SHARP_POMMEL} fill={paint(uid, "guard")} stroke={p.ink.deep} strokeWidth="1.3" />
    </g>
    <path className={s.sharpSpark} d={SHARP_SPARK} fill={paint(uid, "core")} stroke={p.ink.light} strokeWidth="0.8" />
  </>}</BotanicalFrame>;
}

export function ShieldBuffIcon(): ReactElement {
  const p = SHIELD_PALETTE;
  return <BotanicalFrame title="护盾" description="由叶脉和种荚组成的守护标本，代表层叠防护" palette={p}>{(uid) => <>
    <g className={s.shield}><path d={SHIELD_OUTER} fill={p.ink.deep} stroke={p.rim} strokeWidth="1.5" /><path d={SHIELD_FACE} fill={paint(uid, "shield")} /><path d={SHIELD_INNER} fill={paint(uid, "innerShield")} stroke={p.ink.light} strokeOpacity="0.65" strokeWidth="1.1" /><path d={SHIELD_LIT} stroke={p.ink.light} strokeOpacity="0.72" strokeWidth="1.3" />
      <g className={s.shieldVeins} stroke={p.ink.deep} strokeOpacity="0.56" strokeWidth="1.2">{SHIELD_VEINS.map((path) => <path key={path} d={path} />)}</g><path className={s.shieldCore} d={SHIELD_CORE} fill={paint(uid, "core")} stroke={p.ink.deep} strokeWidth="1.4" /><path d={SHIELD_CORE_INNER} fill="none" stroke={p.ink.light} strokeOpacity="0.72" strokeWidth="1" />
      {SHIELD_RIVETS.map((point) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="1.7" fill={p.ink.accent} />)}
    </g><g className={s.shieldHalo} stroke={p.glow.color} strokeOpacity="0.8" strokeWidth="1.1">{SHIELD_HALOS.map((path) => <path key={path} d={path} />)}</g>
  </>}</BotanicalFrame>;
}
