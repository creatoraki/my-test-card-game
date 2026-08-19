import { useState, type CSSProperties } from "react";
import s from "./SlashAttackDemo.module.css";

const PARTICLES = [
  { x: -210, y: -112, size: 5, delay: 0 },
  { x: -160, y: 92, size: 4, delay: 34 },
  { x: -116, y: -168, size: 6, delay: 58 },
  { x: -62, y: 142, size: 4, delay: 20 },
  { x: 18, y: -194, size: 5, delay: 76 },
  { x: 82, y: 156, size: 4, delay: 44 },
  { x: 138, y: -128, size: 6, delay: 16 },
  { x: 202, y: 86, size: 5, delay: 64 },
  { x: -246, y: 22, size: 4, delay: 92 },
  { x: 252, y: -16, size: 4, delay: 108 },
  { x: -76, y: 216, size: 5, delay: 126 },
  { x: 116, y: 218, size: 4, delay: 146 },
] as const;

const FRACTURES = [
  { angle: -164, length: 108, delay: 0 },
  { angle: -132, length: 82, delay: 34 },
  { angle: -98, length: 124, delay: 16 },
  { angle: -52, length: 92, delay: 48 },
  { angle: -18, length: 116, delay: 26 },
  { angle: 24, length: 84, delay: 66 },
  { angle: 66, length: 126, delay: 8 },
  { angle: 108, length: 96, delay: 42 },
  { angle: 148, length: 112, delay: 72 },
] as const;

const SHARDS = [
  { x: -178, y: -84, rotate: -34, delay: 0 },
  { x: -132, y: 112, rotate: 22, delay: 28 },
  { x: -52, y: -142, rotate: 48, delay: 14 },
  { x: 44, y: 152, rotate: -18, delay: 46 },
  { x: 126, y: -104, rotate: 64, delay: 22 },
  { x: 184, y: 68, rotate: -42, delay: 58 },
] as const;

const PHASES = [
  { number: "01", name: "压低刀锋", detail: "方向锁定" },
  { number: "02", name: "双刃贯入", detail: "错峰命中" },
  { number: "03", name: "伤口张开", detail: "停顿后裂" },
] as const;

function cssVars(values: Record<string, string | number>) {
  return values as CSSProperties;
}

export function SlashAttackDemo() {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <section
      className={s.root}
      style={cssVars({
        "--slash-accent": "#79f4dd",
        "--slash-hot": "#ffe19a",
        "--slash-pink": "#ef8fb4",
      })}
    >
      <header className={s.header}>
        <div>
          <span className={s.kicker}>LUNA / VFX STUDY 02</span>
          <h1>月蚀回旋斩</h1>
          <p>以压低刀锋、错峰贯入和延迟裂口构成的近战攻击特效，用速度与停顿强调命中。</p>
        </div>
        <button
          className={s.replayButton}
          type="button"
          onClick={() => setReplayKey((key) => key + 1)}
          aria-label="重新播放月蚀回旋斩特效"
        >
          <span className={s.replayIcon} aria-hidden="true">↻</span>
          重播斩击
        </button>
      </header>

      <div className={s.content}>
        <div className={s.stageColumn}>
          <div className={s.stageMeta}>
            <span>ATTACK PREVIEW / TARGET LOCKED</span>
            <strong>01.3 SEC</strong>
          </div>

          <div className={s.stageFrame}>
            <div className={s.stage} key={replayKey} role="img" aria-label="月蚀回旋斩攻击特效演示">
              <div className={s.sceneGrid} aria-hidden="true" />
              <div className={s.sceneNoise} aria-hidden="true" />
              <div className={s.targetShadow} aria-hidden="true" />
              <div className={s.target} aria-hidden="true">
                <span className={s.targetCrown} />
                <span className={s.targetBody} />
                <span className={s.targetCore} />
              </div>

              <div className={s.effect} aria-hidden="true">
                <span className={s.slashWindup} />
                <span className={`${s.slashBlade} ${s.slashBladeA}`} />
                <span className={`${s.slashBlade} ${s.slashBladeB}`} />
                <span className={s.slashScar} />
                <span className={s.slashWound} />
                <span className={s.impactCore} />
                <span className={s.impactBrake} />
                {PARTICLES.map((particle, index) => (
                  <span
                    key={`particle-${index}`}
                    className={s.particle}
                    style={cssVars({
                      "--particle-x": `${particle.x}px`,
                      "--particle-y": `${particle.y}px`,
                      "--particle-size": `${particle.size}px`,
                      "--particle-delay": `${particle.delay}ms`,
                    })}
                  />
                ))}
                {FRACTURES.map((fracture, index) => (
                  <span
                    key={`fracture-${index}`}
                    className={s.fracture}
                    style={cssVars({
                      "--fracture-angle": `${fracture.angle}deg`,
                      "--fracture-length": `${fracture.length}px`,
                      "--fracture-delay": `${fracture.delay}ms`,
                    })}
                  />
                ))}
                {SHARDS.map((shard, index) => (
                  <span
                    key={`shard-${index}`}
                    className={s.shard}
                    style={cssVars({
                      "--shard-x": `${shard.x}px`,
                      "--shard-y": `${shard.y}px`,
                      "--shard-rotate": `${shard.rotate}deg`,
                      "--shard-delay": `${shard.delay}ms`,
                    })}
                  />
                ))}
                <span className={s.impactBurst} />
                <span className={s.impactFlash} />
                <span className={s.afterglow} />
              </div>

              <div className={s.targetLabel} aria-hidden="true">
                <span>HOSTILE / 07</span>
                <i />
              </div>
              <div className={s.impactLabel} aria-hidden="true">HIT CONFIRMED</div>
            </div>
            <div className={s.stageFooter}>
              <span>ARC-BASED MOTION / FIXED GEOMETRY</span>
              <span>IMPACT 0.72S</span>
            </div>
          </div>
        </div>

        <aside className={s.detail}>
          <span className={s.detailLabel}>ANIMATION PROFILE / LUNA 02</span>
          <h2>先让刀锋停住，<br />再让伤口开口。</h2>
          <p className={s.detailDescription}>第一道刀光负责建立方向，第二道从反侧追上。命中后短暂停顿，裂口才沿着刃线亮起。</p>

          <div className={s.phaseList} aria-label="特效阶段">
            {PHASES.map((phase, index) => (
              <div className={s.phase} key={phase.number}>
                <span className={s.phaseNumber}>{phase.number}</span>
                <div>
                  <strong>{phase.name}</strong>
                  <small>{phase.detail}</small>
                </div>
                <i className={index === PHASES.length - 1 ? s.phaseDotLast : undefined} />
              </div>
            ))}
          </div>

          <div className={s.metrics}>
            <div>
              <span>PRIMARY</span>
              <strong><i className={s.colorSwatch} />AQUA / ECLIPSE</strong>
            </div>
            <div>
              <span>MOTION</span>
              <strong>SNAP + PAUSE + OPEN</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}