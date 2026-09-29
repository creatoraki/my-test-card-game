import { useState, type CSSProperties } from "react";
import sceneArt from "@/assets/占位场景素材.webp";
import dummyArt from "@/assets/占位素材.webp";
import { ANIM } from "@/ui/battle/choreo/animations";
import { UNIT_BODY_ATTR, unitShellAttrs } from "@/ui/battle/choreo/unitShell";
import { HitFxLayer } from "@/ui/battle/fx/HitFxLayer";
import { DEMO_ANIMS, DEMO_MODES } from "./sfxDemos";
import { useSfxDemo } from "./useSfxDemo";
import s from "./SfxShowcase.module.css";

const RATES = [1, 2] as const;

/** 攻击音效试听: 左侧按模式列出 demo, 右侧木桩实际挂载战斗命中特效, 音画同步播放。 */
export function SfxShowcase() {
  const [rate, setRate] = useState<number>(1);
  const [layerHitSample, setLayerHitSample] = useState(true);
  const { hit, active, play } = useSfxDemo(rate, layerHitSample);

  // 与战斗一致的命中变量, 但按倍速缩放: 试听页没有 BattleScreen 的时间轴替它换算。
  const preset = hit ? ANIM[hit.anim] : null;
  const impactMs = (preset?.proc?.impactMs ?? 0) / rate;
  const unitVars = {
    "--vfx-color": preset?.color ?? "#fff",
    "--vfx-impact": `${impactMs}ms`,
    "--vfx-float-delay": `${impactMs}ms`,
    "--vfx-float-dur": `${(preset?.proc?.floatMs ?? 950) / rate}ms`,
  } as CSSProperties;

  return <div className={s.root} style={{ "--fx-rate": rate } as CSSProperties}>
    <img className={s.scene} src={sceneArt} alt="" draggable={false} />
    <div className={s.shade} aria-hidden />

    <div className={s.unit} {...unitShellAttrs({ side: "enemy", react: hit ? "hit" : null })} style={unitVars}>
      <img key={hit?.seq ?? 0} {...UNIT_BODY_ATTR} className={s.dummy} src={dummyArt} alt="" draggable={false} />
      <HitFxLayer hit={hit} />
    </div>

    <section className={s.panel}>
      <h2 className={s.title}>攻击音效试听</h2>
      {DEMO_MODES.map(({ mode, name, note }) => <div key={mode} className={s.group}>
        <div className={s.groupHead}>
          <span className={s.groupName}>{name}</span>
          <span className={s.groupNote}>{note}</span>
        </div>
        <div className={s.demos}>
          {DEMO_ANIMS.map(({ anim, name: animName, note: animNote }) => <button
            key={anim}
            type="button"
            className={`${s.demo} ${active === `${mode}:${anim}` ? s.playing : ""}`}
            onClick={() => play(mode, anim)}
          >
            <span className={s.demoName}>{animName}</span>
            <span className={s.demoNote}>{animNote}</span>
          </button>)}
        </div>
      </div>)}

      <div className={s.options}>
        <span className={s.optionLabel}>倍速</span>
        {RATES.map((value) => <button
          key={value}
          type="button"
          className={`${s.chip} ${rate === value ? s.on : ""}`}
          onClick={() => setRate(value)}
        >
          {value === 1 ? "一倍" : "两倍"}
        </button>)}
        <span className={s.optionLabel}>叠加受击采样</span>
        <button type="button" className={`${s.chip} ${layerHitSample ? s.on : ""}`} onClick={() => setLayerHitSample((value) => !value)}>
          {layerHitSample ? "开" : "关"}
        </button>
      </div>
      <p className={s.hint}>点击任一特效即在右侧木桩上音画同步播放；同一特效可在两种模式间来回对比。</p>
    </section>
  </div>;
}
