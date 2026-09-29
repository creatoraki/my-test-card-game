import { createPortal } from "react-dom";
import { useEffect, useRef, type CSSProperties } from "react";
import { playSfx } from "@/ui/audio";
import { PlateButton } from "@/ui/common/control/PlateButton";
import { PANEL_OUT_MS, PanelShell } from "@/ui/common/frame/PanelShell";
import { useRevealPresence } from "@/ui/common/frame/ModalReveal";
import { cx } from "@/ui/common/shared/cx";
import { useConfirmStore, type ConfirmRequest } from "./confirmStore";
import s from "./ConfirmDialog.module.css";

// 外观与系统设置面板同一套: PanelShell 外壳(切角半透面板 + 页眉) + 事件档案同款切角板按钮。
const ACCENT = "#52cfff";
const DANGER_ACCENT = "#ff6a5e";
const DIALOG_SIZE = { w: 700 };

export function ConfirmDialog() {
  const request = useConfirmStore((state) => state.request);
  const closeConfirm = useConfirmStore((state) => state.closeConfirm);
  const presence = useRevealPresence(Boolean(request), request, PANEL_OUT_MS);
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
    }, PANEL_OUT_MS);
  }

  if (typeof document === "undefined" || !presence.mounted || !presence.data) return null;

  const activeRequest = presence.data;
  const danger = Boolean(activeRequest.danger);
  const dismissible = activeRequest.dismissible !== false;
  const accent = danger ? DANGER_ACCENT : ACCENT;

  return createPortal(
    <PanelShell
      accent={accent}
      themeStyle={{ "--asm-frame": accent } as CSSProperties}
      title={activeRequest.title}
      status={danger ? "危险操作" : "操作确认"}
      closeLabel={activeRequest.cancelLabel ?? "取消"}
      closing={presence.closing}
      sfx={false}
      size={DIALOG_SIZE}
      className={cx(s.layer, !dismissible && s.locked)}
      onClose={() => {
        if (dismissible) settle("cancel");
      }}
    >
      <div className={s.body} role="alertdialog" aria-modal="true" aria-label={activeRequest.title}>
        {activeRequest.text && <p className={s.text}>{activeRequest.text}</p>}
        {activeRequest.detail && <p className={s.detail}>{activeRequest.detail}</p>}
        <div className={s.actions}>
          <PlateButton
            ref={cancelRef}
            label={activeRequest.cancelLabel ?? "取消"}
            icon="back"
            onClick={() => settle("cancel")}
          />
          <PlateButton
            label={activeRequest.confirmLabel ?? "确认"}
            icon={danger ? "warn" : "confirm"}
            lit
            danger={danger}
            onClick={() => settle("confirm")}
          />
        </div>
      </div>
    </PanelShell>,
    document.querySelector<HTMLElement>("[data-stage-canvas]") ?? document.body,
  );
}

export default ConfirmDialog;
