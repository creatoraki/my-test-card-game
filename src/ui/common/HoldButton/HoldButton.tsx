import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./HoldButton.module.css";

interface Props {
  holdMs?: number;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  onComplete: () => void;
}

export function HoldButton({
  holdMs = 1500,
  disabled = false,
  className,
  children,
  "aria-label": ariaLabel,
  onComplete,
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<number | null>(null);
  const firedFrameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const holdingRef = useRef(false);
  const firedRef = useRef(false);

  function setProgress(progress: number) {
    buttonRef.current?.style.setProperty("--hold-progress", String(progress));
  }

  function stopFrame() {
    if (frameRef.current != null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }

  function stopFiredFrame() {
    if (firedFrameRef.current != null) {
      window.cancelAnimationFrame(firedFrameRef.current);
      firedFrameRef.current = null;
    }
  }

  function cancelHold() {
    stopFrame();
    holdingRef.current = false;
    setProgress(0);
    buttonRef.current?.removeAttribute("data-holding");
    if (!firedRef.current) buttonRef.current?.removeAttribute("data-fired");
  }

  function fire() {
    stopFrame();
    holdingRef.current = false;
    firedRef.current = true;
    setProgress(1);
    buttonRef.current?.removeAttribute("data-holding");
    buttonRef.current?.setAttribute("data-fired", "true");
    firedFrameRef.current = window.requestAnimationFrame(() => {
      firedFrameRef.current = null;
      if (firedRef.current) {
        firedRef.current = false;
        buttonRef.current?.removeAttribute("data-fired");
      }
    });
    onComplete();
  }

  function tick(now: number) {
    if (!holdingRef.current) return;
    const progress = Math.min(1, (now - startedAtRef.current) / Math.max(1, holdMs));
    setProgress(progress);
    if (progress >= 1) {
      fire();
      return;
    }
    frameRef.current = window.requestAnimationFrame(tick);
  }

  function beginHold() {
    if (disabled || holdingRef.current || firedRef.current) return;
    stopFrame();
    holdingRef.current = true;
    startedAtRef.current = performance.now();
    setProgress(0);
    buttonRef.current?.setAttribute("data-holding", "true");
    frameRef.current = window.requestAnimationFrame(tick);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    beginHold();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.repeat) return;
    event.preventDefault();
    beginHold();
  }

  useEffect(() => {
    return () => {
      stopFrame();
      stopFiredFrame();
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      className={cx(s.button, className)}
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      style={{ "--hold-progress": 0 } as CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onBlur={cancelHold}
      onKeyDown={handleKeyDown}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") cancelHold();
      }}
    >
      <span className={s.content}>{children}</span>
    </button>
  );
}
