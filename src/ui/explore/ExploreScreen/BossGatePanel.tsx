import { useEffect, useRef } from "react";
import type { ExploreState } from "@/explore/types";
import { challengeBossGate, closeBossGatePanel } from "@/store/exploreCorridor";
import { setTransitionOrigin } from "@/ui/app/transitionOrigin";
import s from "./BossGatePanel.module.css";

export function BossGatePanel({ session }: { session: ExploreState }) {
  const panel = useRef<HTMLElement>(null);
  const actionable = session.phase === "atNode";

  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);

  useEffect(() => {
    if (!panel.current) return;
    panel.current.inert = !actionable;
    if (actionable) panel.current.focus();
  }, [actionable]);

  return <div className={s.backdrop}>
    <section
      ref={panel}
      className={s.panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="boss-gate-heading"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape" && actionable) {
          event.stopPropagation();
          closeBossGatePanel();
          return;
        }
        if (event.key !== "Tab") return;
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        if (!buttons.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div className={s.seal} aria-hidden>☗</div>
      <div className={s.content}>
        <div className={s.eyebrow}>封锁红门</div>
        <h2 id="boss-gate-heading">首领所在</h2>
        <p className={s.description}>红门之后封存着这片区域的核心敌意。你可以先继续搜索房间里的物件，准备妥当后再回来开启挑战。</p>
        <p className={s.warning}>开启首领战后将无法返回副本继续搜索。胜利即通关；失败或撤退按撤离副本结算。</p>
        <div className={s.actions}>
          <button
            className={s.challenge}
            type="button"
            disabled={!actionable}
            onClick={(event) => {
              setTransitionOrigin(event.clientX, event.clientY);
              challengeBossGate();
            }}
          >
            挑战首领
          </button>
          <button className={s.leave} type="button" disabled={!actionable} onClick={closeBossGatePanel}>
            暂不挑战，继续搜索
          </button>
        </div>
      </div>
    </section>
  </div>;
}
