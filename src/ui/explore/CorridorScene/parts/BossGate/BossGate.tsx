import { BOSS_GATE_GEOMETRY, BOSS_GATE_PROGRAM, BOSS_GATE_UNIFORMS } from "@/ui/art/portal";
import { GlslSprite } from "@/ui/common/fx/GlslSprite";
import s from "../../CorridorScene.module.css";

export function BossGate({
  x,
  top,
  near,
  blocked,
  onClick,
}: {
  x: number;
  top: number;
  near: boolean;
  blocked: boolean;
  onClick: () => void;
}) {
  const disabled = blocked || !near;
  return <div className={`${s.object} ${s.bossGate}`} style={{ left: x, top: top + BOSS_GATE_GEOMETRY.groundInset }}>
    <button
      className={s.objectButton}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={near ? "首领红门，靠近后交互" : "首领红门，查看"}
    >
      <GlslSprite
        program={BOSS_GATE_PROGRAM}
        width={BOSS_GATE_GEOMETRY.width}
        height={BOSS_GATE_GEOMETRY.height}
        uniforms={BOSS_GATE_UNIFORMS}
        active={near}
        seed={0.73}
      />
    </button>
    {near && <span className={s.bossGatePrompt}>空格 · 挑战首领</span>}
  </div>;
}
