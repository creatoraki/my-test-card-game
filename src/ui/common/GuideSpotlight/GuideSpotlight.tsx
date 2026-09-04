import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  designRectOf,
  designScaleOf,
  stageHostOf,
  STAGE,
  type DesignRect,
} from "@/ui/hooks/stage";
import { useGuideStore, type GuideStep } from "./guideStore";
import s from "./GuideSpotlight.module.css";

const GUIDE_DELAY_MS = 400;
const STABLE_FRAMES = 3;
const SETTLE_TIMEOUT_MS = 1200;
const ANCHOR_MISS_MS = 200;
const GUIDE_GAP = 24;
const GUIDE_MARGIN = 28;
const GUIDE_WIDTH = 460;

interface GuideLayout {
  stepId: string;
  host: HTMLElement;
  rect: DesignRect | null;
}

interface GuideBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface CardPlacement {
  stepId: string;
  left: number;
  top: number;
}

function sameRect(left: DesignRect | null, right: DesignRect | null): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  return left.x === right.x && left.y === right.y && left.w === right.w && left.h === right.h;
}

function useGuideLayout(step: GuideStep | null): GuideLayout | null {
  const [layout, setLayout] = useState<GuideLayout | null>(null);

  useEffect(() => {
    if (!step) {
      setLayout(null);
      return;
    }

    setLayout(null);
    let frame: number | null = null;
    let timer: number | null = null;
    let startedAt = 0;
    let stableCount = 0;
    let candidateHost: HTMLElement | null = null;
    let candidateRect: DesignRect | null = null;

    const lockLayout = (host: HTMLElement, rect: DesignRect | null) => {
      setLayout({ stepId: step.id, host, rect });
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    };

    const measure = () => {
      const target = document.querySelector<HTMLElement>(
        `[data-guide-anchor="${step.anchor}"]`,
      );
      const fallbackHost = document.querySelector<HTMLElement>("[data-stage-canvas]");
      const host = target ? stageHostOf(target) : fallbackHost;
      const rect = target ? designRectOf(target) : null;
      const elapsed = performance.now() - startedAt;

      if (host && rect) {
        if (candidateHost === host && sameRect(candidateRect, rect)) {
          stableCount += 1;
        } else {
          candidateHost = host;
          candidateRect = rect;
          stableCount = 1;
        }

        if (stableCount >= STABLE_FRAMES) {
          lockLayout(host, rect);
          return;
        }
      } else {
        candidateHost = null;
        candidateRect = null;
        stableCount = 0;

        if (fallbackHost && elapsed >= ANCHOR_MISS_MS) {
          lockLayout(fallbackHost, null);
          return;
        }
      }

      if (elapsed >= SETTLE_TIMEOUT_MS) {
        lockLayout(candidateHost ?? fallbackHost ?? host, candidateRect);
        return;
      }

      frame = window.requestAnimationFrame(measure);
    };

    timer = window.setTimeout(() => {
      startedAt = performance.now();
      measure();
    }, step.delayMs ?? GUIDE_DELAY_MS);

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [step?.anchor, step?.delayMs, step?.id]);

  return layout?.stepId === step?.id ? layout : null;
}

function focusBox(rect: DesignRect, padding: number): GuideBox {
  return {
    left: Math.max(0, rect.x - padding),
    top: Math.max(0, rect.y - padding),
    right: Math.min(STAGE.width, rect.x + rect.w + padding),
    bottom: Math.min(STAGE.height, rect.y + rect.h + padding),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), Math.max(min, max));
}

export function GuideSpotlight() {
  const step = useGuideStore((state) => state.queue[0] ?? null);
  const dismissTop = useGuideStore((state) => state.dismissTop);
  const layout = useGuideLayout(step);
  const cardRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [cardPlacement, setCardPlacement] = useState<CardPlacement | null>(null);

  useLayoutEffect(() => {
    if (!step || !layout || !cardRef.current) {
      setCardPlacement((current) => (current?.stepId === step?.id ? null : current));
      return;
    }

    const host = layout.host;
    const scale = designScaleOf(host);
    const cardRect = cardRef.current.getBoundingClientRect();
    const width = cardRect.width / scale;
    const height = cardRect.height / scale;
    const boxWidth = host.clientWidth || STAGE.width;
    const boxHeight = host.clientHeight || STAGE.height;
    const targetBox = layout.rect
      ? focusBox(layout.rect, step.padding ?? 12)
      : null;
    const wantedLeft = targetBox
      ? (targetBox.left + targetBox.right) / 2 - width / 2
      : (boxWidth - width) / 2;
    const left = clamp(wantedLeft, GUIDE_MARGIN, boxWidth - width - GUIDE_MARGIN);

    if (!targetBox) {
      const top = clamp((boxHeight - height) / 2, GUIDE_MARGIN, boxHeight - height - GUIDE_MARGIN);
      setCardPlacement((current) =>
        current?.stepId === step.id && current.left === left && current.top === top
          ? current
          : { stepId: step.id, left, top },
      );
      return;
    }

    const below = targetBox.bottom + GUIDE_GAP;
    const above = targetBox.top - height - GUIDE_GAP;
    const top =
      below + height <= boxHeight - GUIDE_MARGIN || above < GUIDE_MARGIN
        ? clamp(below, GUIDE_MARGIN, boxHeight - height - GUIDE_MARGIN)
        : clamp(above, GUIDE_MARGIN, boxHeight - height - GUIDE_MARGIN);
    setCardPlacement((current) =>
      current?.stepId === step.id && current.left === left && current.top === top
        ? current
        : { stepId: step.id, left, top },
    );
  }, [layout, step]);

  useEffect(() => {
    if (!step || !layout) return;
    buttonRef.current?.focus();
  }, [layout?.host, step?.id]);

  useEffect(() => {
    if (!step) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== "Escape") return;
      event.preventDefault();
      dismissTop();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismissTop, step?.id]);

  if (typeof document === "undefined" || !step || !layout) return null;

  const placementReady = cardPlacement?.stepId === step.id;
  const targetBox = layout.rect ? focusBox(layout.rect, step.padding ?? 12) : null;
  const titleId = `guide-title-${step.id}`;
  const cardStyle: CSSProperties = {
    left: `${cardPlacement?.left ?? 0}px`,
    top: `${cardPlacement?.top ?? 0}px`,
    visibility: placementReady ? "visible" : "hidden",
  };

  return createPortal(
    <div
      className={s.layer}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {targetBox ? (
        <div
          className={s.focus}
          aria-hidden="true"
          style={{
            left: `${targetBox.left}px`,
            top: `${targetBox.top}px`,
            width: `${targetBox.right - targetBox.left}px`,
            height: `${targetBox.bottom - targetBox.top}px`,
          }}
        />
      ) : (
        <div className={s.scrim} aria-hidden="true" />
      )}
      <section ref={cardRef} className={s.card} style={cardStyle}>
        <span className={s.kicker}>新手引导</span>
        <h2 id={titleId} className={s.title}>{step.title}</h2>
        <p className={s.text}>{step.text}</p>
        <button ref={buttonRef} className={s.button} type="button" onClick={dismissTop}>
          知道了
        </button>
      </section>
    </div>,
    layout.host,
  );
}

export default GuideSpotlight;
