import { playSfx } from "./sfxPlayer";

const INTERACTIVE_SELECTOR = 'button, [role="button"], a[href]';

type InteractiveElement = Element & {
  disabled?: boolean;
};

function interactiveFrom(event: Event): InteractiveElement | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  return target.closest(INTERACTIVE_SELECTOR) as InteractiveElement | null;
}

function isMuted(element: Element): boolean {
  return element.closest("[data-sfx]")?.getAttribute("data-sfx") === "off";
}

function isDisabled(element: InteractiveElement): boolean {
  return element.disabled === true || element.getAttribute("aria-disabled") === "true";
}

export function installSfxDelegate(): () => void {
  if (typeof document === "undefined") return () => undefined;

  const onPointerDown = (event: Event) => {
    const element = interactiveFrom(event);
    if (!element || isMuted(element)) return;
    if (isDisabled(element)) {
      playSfx("disabled");
      return;
    }
    playSfx("click");
  };

  document.addEventListener("pointerdown", onPointerDown, { passive: true });
  return () => {
    document.removeEventListener("pointerdown", onPointerDown);
  };
}
