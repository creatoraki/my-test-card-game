import { useCallback, useEffect, useLayoutEffect, type RefObject } from "react";
import { designScaleOf, stageHostOf } from "@/ui/hooks/stage";

type Subscriber = () => void;

const subscribers = new Set<Subscriber>();
let removeGlobalListeners: (() => void) | null = null;
let resizeFrame: number | null = null;

function broadcast() {
  resizeFrame = null;
  subscribers.forEach((subscriber) => subscriber());
  if (subscribers.size > 0) requestAnimationFrame(() => subscribers.forEach((subscriber) => subscriber()));
}

function scheduleBroadcast() {
  if (resizeFrame === null) resizeFrame = requestAnimationFrame(broadcast);
}

function startGlobalListeners() {
  if (removeGlobalListeners) return;

  const onResolutionChange = () => {
    scheduleBroadcast();
    unlisten();
    media = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    listen();
  };
  let media = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  const listen = () => {
    if (media.addEventListener) media.addEventListener("change", onResolutionChange);
    else media.addListener?.(onResolutionChange);
  };
  const unlisten = () => {
    if (media.removeEventListener) media.removeEventListener("change", onResolutionChange);
    else media.removeListener?.(onResolutionChange);
  };

  window.addEventListener("resize", scheduleBroadcast);
  listen();
  removeGlobalListeners = () => {
    window.removeEventListener("resize", scheduleBroadcast);
    unlisten();
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
    removeGlobalListeners = null;
  };
}

function subscribe(subscriber: Subscriber) {
  subscribers.add(subscriber);
  startGlobalListeners();
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) removeGlobalListeners?.();
  };
}

export function useGlowScale(ref: RefObject<HTMLElement | null>, enabled: boolean): () => void {
  const remeasure = useCallback(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--glow-scale", String(designScaleOf(stageHostOf(element))));
  }, [enabled, ref]);

  useLayoutEffect(() => {
    if (enabled) remeasure();
  }, [enabled, remeasure]);

  useEffect(() => {
    if (!enabled) return;
    return subscribe(remeasure);
  }, [enabled, remeasure]);

  return remeasure;
}