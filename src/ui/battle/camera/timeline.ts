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
  const cues: Cue[] = [];
  let raf = 0;
  let elapsed = 0;
  let wallElapsed = 0;
  let last = 0;
  let running = false;
  const fired = new Set<Cue>();

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
    let next: Cue | undefined;
    do {
      next = cues
        .filter((cue) => !fired.has(cue))
        .filter((cue) => (cue.unscaled ? wallElapsed : elapsed) >= cue.at)
        .sort((a, b) => a.at - b.at)[0];
      if (next) {
        fired.add(next);
        next.run();
      }
    } while (next);
    if (fired.size >= cues.length) finish();
    else raf = requestAnimationFrame(frame);
  };

  return {
    seq,
    add(cue) {
      cues.push(cue);
      cues.sort((a, b) => a.at - b.at);
    },
    schedule(delay, run, unscaled = false) {
      cues.push({
        at: (unscaled ? wallElapsed : elapsed) + Math.max(0, delay),
        run,
        unscaled,
      });
      cues.sort((a, b) => a.at - b.at);
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
      let next: Cue | undefined;
      do {
        next = cues.find((cue) => !fired.has(cue));
        if (next) {
          fired.add(next);
          next.run();
        }
      } while (next);
      finish();
    },
  };
}
