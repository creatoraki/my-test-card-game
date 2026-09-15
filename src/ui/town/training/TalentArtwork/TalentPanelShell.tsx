import { useEffect, type CSSProperties, type ReactNode, type Ref } from "react";
import { playSfx } from "@/ui/audio";
import { box, COLLAPSE_MS, PANEL_COLLAPSE_CLASS, type Rect } from "@/ui/common/panelMorph";
import { TALENT_BG_ART } from "@/ui/art/sceneArt";
import { cx } from "@/ui/common/cx";
import { TalentBorder } from "./TalentBorder";
import s from "./TalentPanelShell.module.css";

export interface TalentMorph {
  ref: Ref<HTMLElement>;
  rect: Rect;
  ready: boolean;
  seed?: ReactNode;
  seedLabel?: string;
}
export function TalentPanelShell({ closing, onClose, morph, children }: {
  closing: boolean; onClose: () => void; morph: TalentMorph; children: ReactNode;
}) {
  useEffect(() => { playSfx("panel"); }, []);
  const shown = morph.ready || closing;
  return (
    <section ref={morph.ref} className={cx(s.panel, closing && PANEL_COLLAPSE_CLASS)}
      style={{ ...box(morph.rect), "--collapse-ms": `${COLLAPSE_MS}ms` } as CSSProperties}
      aria-label="天赋训练" data-talent-phase={closing ? "closing" : morph.ready ? "open" : "opening"}>
      {shown ? <div className={s.canvas}
        style={{ transform: `scale(${morph.rect.w / 1672}, ${morph.rect.h / 941})` }}>
        <img className={s.background} src={TALENT_BG_ART} alt="" draggable={false} />
        <div className={s.shade} aria-hidden="true" />
        <TalentBorder />
        {children}
        <button type="button" className={s.close} onClick={onClose} data-sfx="back" aria-label="关闭天赋训练">
          <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
            <circle cx="36" cy="36" r="30" fill="#171712" fillOpacity=".9" stroke="#7f6338" strokeWidth="2" />
            <circle cx="36" cy="36" r="26" stroke="#e5bb72" strokeWidth="1.4" />
            <path d="m26 25 20 22M46 25 26 47" stroke="#fff0cf" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M6 30v12M30 6h12M66 30v12M30 66h12" stroke="#a17b3d" />
          </svg>
        </button>
      </div> : <div className={s.seed}>{morph.seed}<strong>{morph.seedLabel ?? "天赋训练"}</strong></div>}
    </section>
  );
}
