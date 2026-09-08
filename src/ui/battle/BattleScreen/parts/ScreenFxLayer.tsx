import type { BattleState } from "@/engine";
import { ANIM, type HitFx } from "@/ui/battle/animations";
import { HurtVignette } from "@/ui/battle/fx/HurtVignette";
import s from "./ScreenFxLayer.module.css";

interface Props {
  hits: Record<string, HitFx>;
  playerIds: BattleState["playerIds"];
}

export function ScreenFxLayer({ hits, playerIds }: Props) {
  const dimHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "dim");
  const flashHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "flash");
  const bloodHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "blood");
  const glitchHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "glitch");
  const hurtHit = Object.entries(hits).find(
    ([id, hit]) => playerIds.includes(id) && hit.floats.some((float) => float.tone === "dmg"),
  )?.[1];

  return (
    <>
      {dimHit && <div key={dimHit.seq} className={s["battle-dim"]} aria-hidden />}
      {flashHit && <div key={flashHit.seq} className={s["battle-flash"]} aria-hidden />}
      {bloodHit && <div key={bloodHit.seq} className={s["battle-blood"]} aria-hidden />}
      {glitchHit && <div key={glitchHit.seq} className={s["battle-glitch"]} aria-hidden />}
      {hurtHit && <HurtVignette key={hurtHit.seq} seq={hurtHit.seq} />}
    </>
  );
}
