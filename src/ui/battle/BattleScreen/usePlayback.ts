import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { Timeline } from "@/ui/battle/camera";
import type { CameraRigApi } from "@/ui/battle/camera";

export interface PlaybackApi {
  animating: boolean;
  animatingRef: MutableRefObject<boolean>;
  seqRef: MutableRefObject<number>;
  timelineRef: MutableRefObject<Timeline | null>;
  hitstop: boolean;
  setHitstop: (value: boolean) => void;
  fxRate: number;
  speed2x: boolean;
  playbackRateRef: MutableRefObject<number>;
  setPlaybackRate: (rate: number, persist?: boolean) => void;
  togglePlaybackSpeed: () => void;
  lock: () => void;
  unlock: () => void;
  bumpSeq: () => number;
}

export function usePlayback(rig: CameraRigApi, battleSeq: number): PlaybackApi {
  const [animating, setAnimating] = useState(false);
  const animatingRef = useRef(false);
  const seqRef = useRef(0);
  const timelineRef = useRef<Timeline | null>(null);
  const [hitstop, setHitstop] = useState(false);
  const [fxRate, setFxRate] = useState(1);
  const [speed2x, setSpeed2x] = useState(false);
  const playbackRateRef = useRef(1);

  const setPlaybackRate = useCallback((rate: number, persist = true) => {
    if (persist) playbackRateRef.current = rate;
    rig.setTimeScale(rate);
    setFxRate(rate);
  }, [rig]);

  const togglePlaybackSpeed = useCallback(() => {
    const next = playbackRateRef.current === 2 ? 1 : 2;
    playbackRateRef.current = next;
    setSpeed2x(next === 2);
    if (hitstop) {
      setFxRate(next);
    } else if (animatingRef.current) {
      setPlaybackRate(next);
    }
  }, [hitstop, setPlaybackRate]);

  const lock = useCallback(() => {
    animatingRef.current = true;
    setAnimating(true);
    setPlaybackRate(playbackRateRef.current);
  }, [setPlaybackRate]);

  const unlock = useCallback(() => {
    animatingRef.current = false;
    setAnimating(false);
  }, []);

  const bumpSeq = useCallback(() => {
    seqRef.current += 1;
    return seqRef.current;
  }, []);

  useEffect(() => {
    setHitstop(false);
    setSpeed2x(false);
    animatingRef.current = false;
    setAnimating(false);
    timelineRef.current?.cancel();
    timelineRef.current = null;
    bumpSeq();
    setPlaybackRate(1);
  }, [battleSeq, bumpSeq, setPlaybackRate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!animatingRef.current || (event.key !== "Escape" && event.code !== "Space")) return;
      event.preventDefault();
      timelineRef.current?.flush();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => () => {
    timelineRef.current?.cancel();
  }, []);

  return {
    animating,
    animatingRef,
    seqRef,
    timelineRef,
    hitstop,
    setHitstop,
    fxRate,
    speed2x,
    playbackRateRef,
    setPlaybackRate,
    togglePlaybackSpeed,
    lock,
    unlock,
    bumpSeq,
  };
}
