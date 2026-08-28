import { playSfx } from "./sfxPlayer";
import { isSfxId, type SfxId } from "./sfxTypes";

const INTERACTIVE_SELECTOR = 'button, [role="button"], a[href]';

type InteractiveElement = Element & {
  disabled?: boolean;
};

function interactiveFrom(event: Event): InteractiveElement | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  return target.closest(INTERACTIVE_SELECTOR) as InteractiveElement | null;
}

function overrideOf(element: Element): SfxId | null {
  const value = element.getAttribute("data-sfx");
  return value && isSfxId(value) ? value : null;
}

function isMuted(element: Element): boolean {
  return element.getAttribute("data-sfx") === "off";
}

function isDisabled(element: InteractiveElement): boolean {
  return element.disabled === true || element.getAttribute("aria-disabled") === "true";
}

export function installSfxDelegate(): () => void {
  if (typeof document === "undefined") return () => undefined;
  let hovered: InteractiveElement | null = null;

  const onPointerOver = (event: Event) => {
    const element = interactiveFrom(event);
    if (!element || isMuted(element) || isDisabled(element)) return;
    const relatedTarget = (event as PointerEvent).relatedTarget;
    if (relatedTarget instanceof Node && element.contains(relatedTarget)) {
      hovered = element;
      return;
    }
    if (hovered === element) return;
    hovered = element;
    playSfx(overrideOf(element) ?? "hover");
  };

  const onPointerOut = (event: Event) => {
    const element = interactiveFrom(event);
    if (!element) return;
    const relatedTarget = (event as PointerEvent).relatedTarget;
    if (!(relatedTarget instanceof Node) || !element.contains(relatedTarget)) {
      if (hovered === element) hovered = null;
    }
  };

  const onPointerDown = (event: Event) => {
    const element = interactiveFrom(event);
    if (!element || isMuted(element)) return;
    if (isDisabled(element)) {
      playSfx("disabled");
      return;
    }
    playSfx(overrideOf(element) ?? "click");
  };

  document.addEventListener("pointerover", onPointerOver, { passive: true });
  document.addEventListener("pointerout", onPointerOut, { passive: true });
  document.addEventListener("pointerdown", onPointerDown, { passive: true });
  return () => {
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("pointerout", onPointerOut);
    document.removeEventListener("pointerdown", onPointerDown);
    hovered = null;
  };
}
