import { useEffect, useRef, type CSSProperties } from "react";
import { ModalReveal, modalRevealCloseMs, modalRevealVars, useRevealPresence } from "@/ui/common/frame/ModalReveal";
import type { EncounterChoice } from "../../types";
import s from "./EncounterCard.module.css";

/**
 * 被黑影扑中后的遭遇提示卡: 驱散(守卫溶解, 清房后解锁出口)或后撤(被击退回房间入口)。
 * 用 ModalReveal 的横线展开入场; 1 / 2 键也可以直接选择。
 */
export function EncounterCard({ open, onChoose }: { open: boolean; onChoose(choice: EncounterChoice): void }) {
  const presence = useRevealPresence(open, open, modalRevealCloseMs());
  const firstRef = useRef<HTMLButtonElement>(null);
  const chooseRef = useRef(onChoose);
  chooseRef.current = onChoose;

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Digit1") chooseRef.current("banish");
      else if (event.code === "Digit2" || event.code === "Escape") chooseRef.current("retreat");
      else return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  if (!presence.mounted) return null;
  const style = { ...modalRevealVars(), "--mr-bar-color": "#ff4a36" } as CSSProperties;
  return <div className={s.layer} data-closing={presence.closing || undefined} style={style}>
    <div className={s.scrim} aria-hidden />
    <ModalReveal closing={presence.closing} className={s.panel}>
      <section className={s.content} role="alertdialog" aria-modal="true" aria-labelledby="encounter-title">
        <div className={s.sigil} aria-hidden>
          <span className={s.eyeL} />
          <span className={s.eyeR} />
        </div>
        <h2 id="encounter-title" className={s.title}>黑影扑了上来</h2>
        <p className={s.text}>冰冷的烟雾缠住了你的手脚。它没有脸, 却在盯着你。</p>
        <div className={s.actions}>
          <button ref={firstRef} type="button" className={s.primary} disabled={!open} onClick={() => onChoose("banish")}>
            <span className={s.num} aria-hidden>1</span>
            <span className={s.label}>驱散</span>
            <span className={s.hint}>黑影溶解, 房间清空后出口解锁</span>
          </button>
          <button type="button" className={s.secondary} disabled={!open} onClick={() => onChoose("retreat")}>
            <span className={s.num} aria-hidden>2</span>
            <span className={s.label}>后撤</span>
            <span className={s.hint}>被击退回房间入口, 黑影回到巡逻</span>
          </button>
        </div>
      </section>
    </ModalReveal>
  </div>;
}
