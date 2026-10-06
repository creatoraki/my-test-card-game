import { ANIM, type HitFx } from "@/ui/battle/choreo/animations";
import s from "./StageBackdropFx.module.css";

// 背景调色层: 夹在背景纵深组与敌人平面之间, 只压暗/染色背景, 不盖住敌人和命中特效。
// ScreenFxLayer 在整个舞台之上, 那里的不透明底色会连特效一起罩住 —— 需要「压暗环境、
// 让刀光跳出来」的全屏调色放这里, 只有滤色闪光这类「加亮」的才留在 ScreenFxLayer。
export function StageBackdropFx({ hits }: { hits: Record<string, HitFx> }) {
  const bloodHit = Object.values(hits).find((hit) => ANIM[hit.anim].screenFx === "blood");
  if (!bloodHit) return null;
  return <div key={bloodHit.seq} className={s["backdrop-blood"]} aria-hidden />;
}
