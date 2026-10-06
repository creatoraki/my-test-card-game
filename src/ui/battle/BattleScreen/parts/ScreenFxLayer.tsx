import type { BattleState } from "@/engine";
import { ANIM, type HitFx } from "@/ui/battle/choreo/animations";
import { HurtVignette } from "@/ui/battle/fx/HurtVignette";
import { GaleSweepFx, type GaleTarget } from "@/ui/battle/fx/GaleSweepFx";
import s from "./ScreenFxLayer.module.css";

interface Props {
  hits: Record<string, HitFx>;
  playerIds: BattleState["playerIds"];
  fxRate: number;
}

// 全场级特效(AnimPreset.stage): 整次出牌只挂一份, 覆盖本次全部受击目标。
// 护航代挡的单位不算目标(它演举盾), 全部落空的目标只吃风痕、不落刀痕。
function stageFx(hits: Record<string, HitFx>) {
  const entry = Object.values(hits).find((hit) => ANIM[hit.anim].stage && !hit.guard);
  if (!entry) return null;
  const targets: GaleTarget[] = Object.entries(hits)
    .filter(([, hit]) => hit.anim === entry.anim && !hit.guard)
    .map(([id, hit]) => ({ id, missed: hit.floats.length > 0 && hit.floats.every((f) => f.tone === "miss") }));
  return { hit: entry, targets };
}

export function ScreenFxLayer({ hits, playerIds, fxRate }: Props) {
  const flashHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "flash");
  const bloodHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "blood");
  const glitchHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "glitch");
  const twinHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "twin");
  const thunderHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "thunder");
  const hurtHit = Object.entries(hits).find(
    ([id, hit]) => playerIds.includes(id) && hit.floats.some((float) => float.tone === "dmg"),
  )?.[1];
  const stage = stageFx(hits);

  return (
    <>
      {flashHit && <div key={flashHit.seq} className={s["battle-flash"]} aria-hidden />}
      {/* 血色刀光的暗红黑底色在 StageBackdropFx(敌人之下), 这里只留两次滤色闪光; 本层不在
          .battle-layers 内, 拿不到 --fx-rate, 倍速改由行内下发。 */}
      {bloodHit && (
        <div
          key={bloodHit.seq}
          className={s["battle-blood"]}
          style={{ animationDuration: `${2800 / Math.max(fxRate, 0.25)}ms` }}
          aria-hidden
        />
      )}
      {glitchHit && <div key={glitchHit.seq} className={s["battle-glitch"]} aria-hidden />}
      {twinHit && <div key={twinHit.seq} className={s["battle-twin"]} aria-hidden />}
      {thunderHit && <div key={thunderHit.seq} className={s["battle-thunder"]} aria-hidden />}
      {stage?.hit.anim === "gale-sweep" && (
        <GaleSweepFx
          key={stage.hit.seq}
          targets={stage.targets}
          impactMs={ANIM["gale-sweep"].proc?.impactMs ?? 0}
          fxRate={fxRate}
        />
      )}
      {hurtHit && <HurtVignette key={hurtHit.seq} seq={hurtHit.seq} />}
    </>
  );
}
