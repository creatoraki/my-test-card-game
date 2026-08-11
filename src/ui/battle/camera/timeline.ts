export interface Cue {
  at: number;
  run: () => void;
  unscaled?: boolean;
}

export interface Timeline {
  seq: number;
  add(cue: Cue): void;
  schedule(delay: number, run: () => void, unscaled?: boolean): void;
  start(): void;
  cancel(): void;
  flush(): void;
}

export function createTimeline(seq: number, timeScale: () => number, onDone: () => void): Timeline {
  const scaledCues: Cue[] = [];
  const unscaledCues: Cue[] = [];
  let raf = 0;
  let elapsed = 0;
  let wallElapsed = 0;
  let last = 0;
  let running = false;
  let nextScaled = 0;
  let nextUnscaled = 0;

  const insert = (queue: Cue[], cue: Cue, nextIndex: number): number => {
    let low = nextIndex;
    let high = queue.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (queue[middle].at <= cue.at) low = middle + 1;
      else high = middle;
    }
    queue.splice(low, 0, cue);
    return nextIndex;
  };

  const finish = () => {
    if (!running) return;
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    onDone();
  };

  const frame = (now: number) => {
    if (!running) return;
    if (!last) last = now;
    const delta = Math.min(50, now - last);
    elapsed += delta * Math.max(0, timeScale());
    wallElapsed += delta;
    last = now;
    while (true) {
      const scaled = scaledCues[nextScaled];
      const unscaled = unscaledCues[nextUnscaled];
      const scaledDue = !!scaled && elapsed >= scaled.at;
      const unscaledDue = !!unscaled && wallElapsed >= unscaled.at;
      if (!scaledDue && !unscaledDue) break;
      if (!unscaledDue || (scaledDue && scaled!.at <= unscaled!.at)) {
        nextScaled += 1;
        scaled!.run();
      } else {
        nextUnscaled += 1;
        unscaled!.run();
      }
    }
    if (nextScaled >= scaledCues.length && nextUnscaled >= unscaledCues.length) finish();
    else raf = requestAnimationFrame(frame);
  };

  return {
    seq,
    add(cue) {
      if (cue.unscaled) nextUnscaled = insert(unscaledCues, cue, nextUnscaled);
      else nextScaled = insert(scaledCues, cue, nextScaled);
    },
    schedule(delay, run, unscaled = false) {
      const cue = {
        at: (unscaled ? wallElapsed : elapsed) + Math.max(0, delay),
        run,
        unscaled,
      };
      if (unscaled) nextUnscaled = insert(unscaledCues, cue, nextUnscaled);
      else nextScaled = insert(scaledCues, cue, nextScaled);
    },
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    cancel() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    flush() {
      if (!running) return;
      while (nextScaled < scaledCues.length || nextUnscaled < unscaledCues.length) {
        const scaled = scaledCues[nextScaled];
        const unscaled = unscaledCues[nextUnscaled];
        if (!unscaled || (scaled && scaled.at <= unscaled.at)) {
          nextScaled += 1;
          scaled.run();
        } else {
          nextUnscaled += 1;
          unscaled.run();
        }
      }
      finish();
    },
  };
}
