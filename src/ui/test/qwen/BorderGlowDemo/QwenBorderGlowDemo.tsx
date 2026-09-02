import { useState } from "react";
import { BorderGlow } from "@/ui/common/BorderGlow";
import { FACILITY_CARDS, brickStyle } from "./facilityCards";
import { FieldGroup, OptionField, RangeField } from "./DemoFields";
import s from "./QwenBorderGlowDemo.module.css";

// 光晕色以 "色相 饱和度 亮度" 数值串传入组件。
const GLOW_PRESETS = [
  { key: "amber", label: "琥珀", value: "40 80 80", swatch: "hsl(40deg 80% 80%)" },
  { key: "azure", label: "湛蓝", value: "205 90 72", swatch: "hsl(205deg 90% 72%)" },
  { key: "violet", label: "紫晶", value: "270 85 78", swatch: "hsl(270deg 85% 78%)" },
  { key: "lime", label: "青柠", value: "78 85 70", swatch: "hsl(78deg 85% 70%)" },
];

const COLOR_SCHEMES = [
  { key: "aurora", label: "极光", value: "aurora", swatch: "linear-gradient(90deg,#c084fc,#f472b6,#38bdf8)" },
  { key: "ember", label: "余烬", value: "ember", swatch: "linear-gradient(90deg,#fb923c,#f43f5e,#fbbf24)" },
  { key: "abyss", label: "深渊", value: "abyss", swatch: "linear-gradient(90deg,#22d3ee,#6366f1,#0ea5e9)" },
  { key: "jade", label: "碧玉", value: "jade", swatch: "linear-gradient(90deg,#4ade80,#a3e635,#2dd4bf)" },
];

const COLOR_MAP: Record<string, string[]> = {
  aurora: ["#c084fc", "#f472b6", "#38bdf8"],
  ember: ["#fb923c", "#f43f5e", "#fbbf24"],
  abyss: ["#22d3ee", "#6366f1", "#0ea5e9"],
  jade: ["#4ade80", "#a3e635", "#2dd4bf"],
};

interface SurfacePreset {
  key: string;
  label: string;
  value: string;
  swatch: string;
  /** 传给组件的卡面底色；毛玻璃项必须是半透明色 */
  bg: string;
  glass?: boolean;
  light?: boolean;
}

const SURFACES: SurfacePreset[] = [
  { key: "night", label: "墨夜", value: "night", swatch: "#120F17", bg: "#120F17" },
  { key: "slate", label: "石板", value: "slate", swatch: "#101619", bg: "#101619" },
  { key: "paper", label: "宣纸", value: "paper", swatch: "#F4F1EA", bg: "#F4F1EA", light: true },
  {
    key: "smoke",
    label: "暗毛玻璃",
    value: "smoke",
    swatch: "linear-gradient(135deg, #2a2734cc, #12101acc)",
    bg: "rgb(20 17 28 / 55%)",
    glass: true,
  },
  {
    key: "frost",
    label: "亮毛玻璃",
    value: "frost",
    swatch: "linear-gradient(135deg, #ffffffd9, #dfe7f5b3)",
    bg: "rgb(248 250 255 / 42%)",
    glass: true,
    light: true,
  },
];

/** 卡面尺度档位 → 对应的样式类 */
const SIZE_CLASS: Record<string, string> = {
  lg: s.cardLg,
  md: s.cardMd,
  sm: s.cardSm,
};

export function QwenBorderGlowDemo() {
  const [edgeSensitivity, setEdgeSensitivity] = useState(30);
  const [glowColor, setGlowColor] = useState(GLOW_PRESETS[0].value);
  const [surfaceKey, setSurfaceKey] = useState("smoke");
  const [borderRadius, setBorderRadius] = useState(8);
  const [glowRadius, setGlowRadius] = useState(25);
  const [glowIntensity, setGlowIntensity] = useState(1);
  const [coneSpread, setConeSpread] = useState(0);
  const [fillOpacity, setFillOpacity] = useState(0.25);
  const [scheme, setScheme] = useState("aurora");
  const [glassBlur, setGlassBlur] = useState(25);
  // 整块底板的立体倾斜角（度）与砖块投在后墙上的浓度
  const [boardTilt, setBoardTilt] = useState(9);
  const [wallShadow, setWallShadow] = useState(0.6);
  // 变更 key 即可重挂载全部九张卡，一起重播入场扫光。
  const [sweepKey, setSweepKey] = useState(0);

  const surface = SURFACES.find((item) => item.value === surfaceKey) ?? SURFACES[0];

  return (
    <section className={s.root}>
      <header className={s.header}>
        <p className={s.kicker}>qwen 试验台</p>
        <h1>据点设施 · 边缘光晕 bento</h1>
        <p className={s.description}>
          九张设施砖大小不一、竖缝上下错开，拼起来仍是一个严丝合缝的大矩形；每块只放图标与名称。
          整块底板侧过去带透视，九块砖离墙高低不一，各自把影子投在后面的墙上。
          指针靠近某块边缘时，只有该块的描边、网格填充与外发光响应；右侧参数一次调整、统一作用于全部九张。
        </p>
      </header>

      <div className={s.layout}>
        <div className={s.stage}>
          {/* 舞台背景图案：让毛玻璃卡面有可模糊的内容 */}
          <div className={s.stageArt} aria-hidden="true" />
          <div
            className={s.bento}
            style={{ "--board-tilt": boardTilt, "--wall-shadow": wallShadow } as React.CSSProperties}
          >
            {FACILITY_CARDS.map((card) => {
              const bodyClass = [
                s.cardBody,
                SIZE_CLASS[card.size],
                card.inline ? s.cardInline : "",
                surface.light ? s.cardBodyLight : "",
                card.locked ? s.locked : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                // 跨格只挂在这层纯 div 上：布局归 demo、光效归组件，
                // 不依赖 BorderGlow 是否把 style 透传到根节点。
                // sweepKey 进 key：换 key 即整块重挂载，九张砖同时重播扫光。
                <div
                  key={`${card.id}-${sweepKey}`}
                  className={s.brick}
                  style={brickStyle(card.brick, borderRadius)}
                >
                  <BorderGlow
                    className={s.card}
                    edgeSensitivity={edgeSensitivity}
                    glowColor={glowColor}
                    backgroundColor={surface.bg}
                    glass={surface.glass}
                    glassBlur={glassBlur}
                    lightSurface={surface.light}
                    borderRadius={borderRadius}
                    glowRadius={glowRadius}
                    glowIntensity={glowIntensity}
                    coneSpread={coneSpread}
                    fillOpacity={fillOpacity}
                    colors={COLOR_MAP[scheme]}
                    animated={sweepKey > 0}
                  >
                    <div className={bodyClass}>
                      {card.locked ? <span className={s.lockedTag}>未开放</span> : null}
                      <span className={s.cardIcon}>{card.icon}</span>
                      <span className={s.cardName}>{card.name}</span>
                    </div>
                  </BorderGlow>
                </div>
              );
            })}
          </div>
        </div>

        <div className={s.panel}>
          <FieldGroup title="光效">
            <RangeField label="边缘灵敏度" value={edgeSensitivity} min={0} max={80} onChange={setEdgeSensitivity} />
            <RangeField label="光晕强度" value={glowIntensity} min={0} max={1.6} step={0.05} onChange={setGlowIntensity} />
            <RangeField label="光晕外扩" value={glowRadius} min={0} max={90} suffix="px" onChange={setGlowRadius} />
            <RangeField label="光锥宽度" value={coneSpread} min={0} max={45} onChange={setConeSpread} />
            <RangeField label="填充浓度" value={fillOpacity} min={0} max={1} step={0.05} onChange={setFillOpacity} />
          </FieldGroup>

          <FieldGroup title="外观">
            <RangeField label="圆角" value={borderRadius} min={0} max={64} suffix="px" onChange={setBorderRadius} />
            <OptionField label="发光色" value={glowColor} options={GLOW_PRESETS} onChange={setGlowColor} />
            <OptionField label="渐变配色" value={scheme} options={COLOR_SCHEMES} onChange={setScheme} />
            <OptionField label="卡面底色" value={surfaceKey} options={SURFACES} onChange={setSurfaceKey} />
            {surface.glass ? (
              <RangeField label="毛玻璃模糊" value={glassBlur} min={0} max={40} suffix="px" onChange={setGlassBlur} />
            ) : null}
          </FieldGroup>

          <FieldGroup title="立体">
            <RangeField label="底板倾斜" value={boardTilt} min={0} max={16} step={0.5} suffix="°" onChange={setBoardTilt} />
            <RangeField label="投影浓度" value={wallShadow} min={0} max={1} step={0.05} onChange={setWallShadow} />
          </FieldGroup>

          <button type="button" className={s.replay} onClick={() => setSweepKey((v) => v + 1)}>
            回放入场扫光
          </button>
        </div>
      </div>
    </section>
  );
}
