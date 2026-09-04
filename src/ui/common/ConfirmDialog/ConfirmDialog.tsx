import { createPortal } from "react-dom";
import { useEffect, useRef, type CSSProperties } from "react";
import { playSfx } from "@/ui/audio";
import {
  ModalReveal,
  modalRevealCloseMs,
  modalRevealVars,
  useRevealPresence,
} from "@/ui/common/ModalReveal";
import { ConfirmDecor } from "./ConfirmDecor";
import { useConfirmStore, type ConfirmRequest } from "./confirmStore";
import s from "./ConfirmDialog.module.css";

export function ConfirmDialog() {
  const request = useConfirmStore((state) => state.request);
  const closeConfirm = useConfirmStore((state) => state.closeConfirm);
  const presence = useRevealPresence(Boolean(request), request, modalRevealCloseMs());
  const cancelRef = useRef<HTMLButtonElement>(null);
  const settleTimerRef = useRef<number | null>(null);
  const settlingRequestRef = useRef<ConfirmRequest | null>(null);

  useEffect(() => {
    if (!request || request === settlingRequestRef.current) return;
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = null;
    settlingRequestRef.current = null;
  }, [request]);

  useEffect(() => {
    if (!request) return;
    playSfx("panel");
  }, [request]);

  useEffect(() => {
    if (!request || !presence.mounted) return;
    cancelRef.current?.focus();
  }, [presence.mounted, request]);

  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (request.dismissible === false) return;
        event.preventDefault();
        event.stopPropagation();
        settle("cancel");
      } else if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        settle("confirm");
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [request]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  function settle(kind: "confirm" | "cancel") {
    const activeRequest = presence.data;
    if (!activeRequest || settlingRequestRef.current) return;

    settlingRequestRef.current = activeRequest;
    playSfx(kind === "confirm" ? "confirm" : "back");
    closeConfirm();
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      settlingRequestRef.current = null;
      if (kind === "confirm") activeRequest.onConfirm();
      else activeRequest.onCancel?.();
    }, modalRevealCloseMs());
  }

  if (typeof document === "undefined" || !presence.mounted || !presence.data) return null;

  const activeRequest = presence.data;
  const titleId = "confirm-dialog-title";
  const textId = "confirm-dialog-text";
  const layerStyle = {
    ...modalRevealVars(),
    "--mr-bar-color": activeRequest.danger ? "var(--bad)" : "var(--accent)",
  } as CSSProperties;

  return createPortal(
    <div
      className={s.layer}
      data-closing={presence.closing ? "true" : undefined}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && activeRequest.dismissible !== false) {
          settle("cancel");
        }
      }}
      style={layerStyle}
    >
      <div
        className={s.scrim}
        aria-hidden="true"
        onMouseDown={() => {
          if (activeRequest.dismissible !== false) settle("cancel");
        }}
      />
      <ModalReveal
        closing={presence.closing}
        className={`${s.panel} ${activeRequest.danger ? s.dangerPanel : ""}`}
      >
        <section
          className={s.content}
          data-danger={activeRequest.danger ? "true" : "false"}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={activeRequest.text ? textId : undefined}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <ConfirmDecor />
          <span className={s.kicker}>操作确认</span>
          <h2 id={titleId} className={s.title}>{activeRequest.title}</h2>
          {activeRequest.text && <p id={textId} className={s.text}>{activeRequest.text}</p>}
          {activeRequest.detail && <p className={s.detail}>{activeRequest.detail}</p>}
          <div className={s.actions}>
            <button
              ref={cancelRef}
              className={s.button}
              type="button"
              onClick={() => settle("cancel")}
            >
              {activeRequest.cancelLabel ?? "取消"}
            </button>
            <button
              className={`${s.button} ${s.confirmButton}`}
              data-danger={activeRequest.danger ? "true" : "false"}
              type="button"
              onClick={() => settle("confirm")}
            >
              {activeRequest.confirmLabel ?? "确认"}
            </button>
          </div>
        </section>
      </ModalReveal>
    </div>,
    document.querySelector<HTMLElement>("[data-stage-canvas]") ?? document.body,
  );
}

export default ConfirmDialog;