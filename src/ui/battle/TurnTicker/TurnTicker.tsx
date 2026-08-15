import { useCallback, useEffect, useState } from "react";
import s from "./TurnTicker.module.css";

interface Props {
  round: number;
  tick: number;
}

interface RollingState {
  current: number;
  previous: number | null;
  seq: number;
}

const ROLL_MS = 180;

function formatValue(value: number) {
  return String(value).padStart(2, "0");
}

function RollingNumber({
  value,
  onSequenceChange,
}: {
  value: number;
  onSequenceChange: (seq: number) => void;
}) {
  const [state, setState] = useState<RollingState>({ current: value, previous: null, seq: 0 });

  useEffect(() => {
    setState((previous) => {
      if (previous.current === value) return previous;
      return {
        current: value,
        previous: previous.current,
        seq: previous.seq + 1,
      };
    });
  }, [value]);

  useEffect(() => {
    if (state.seq > 0) onSequenceChange(state.seq);
  }, [onSequenceChange, state.seq]);

  useEffect(() => {
    if (state.previous === null) return;
    const timer = window.setTimeout(() => {
      setState((current) => (current.previous === null ? current : { ...current, previous: null }));
    }, ROLL_MS + 40);
    return () => window.clearTimeout(timer);
  }, [state.previous]);

  const clearPrevious = useCallback(() => {
    setState((current) => (current.previous === null ? current : { ...current, previous: null }));
  }, []);

  return (
    <span className={s.roll} data-animated={state.seq > 0 ? "" : undefined} aria-live="polite">
      {state.previous !== null && (
        <span className={s.digitOut} onAnimationEnd={clearPrevious}>
          {formatValue(state.previous)}
        </span>
      )}
      <span key={state.seq} className={s.digit}>
        {formatValue(state.current)}
      </span>
    </span>
  );
}

export function TurnTicker({ round, tick }: Props) {
  const [rollSeqs, setRollSeqs] = useState({ round: 0, tick: 0 });
  const handleRoundSequence = useCallback((seq: number) => {
    setRollSeqs((current) => (current.round === seq ? current : { ...current, round: seq }));
  }, []);
  const handleTickSequence = useCallback((seq: number) => {
    setRollSeqs((current) => (current.tick === seq ? current : { ...current, tick: seq }));
  }, []);
  const flashSeq = rollSeqs.round + rollSeqs.tick;

  return (
    <aside className={s.plate} data-flash={flashSeq || undefined} aria-label="回合与时刻">
      <span className={s.sweep} key={flashSeq} aria-hidden="true" />
      <div className={s.slot}>
        <span className={s.label}>回合</span>
        <RollingNumber value={round} onSequenceChange={handleRoundSequence} />
      </div>
      <span className={s.sep} aria-hidden="true" />
      <div className={s.slot}>
        <span className={s.label}>时刻</span>
        <RollingNumber value={tick} onSequenceChange={handleTickSequence} />
      </div>
    </aside>
  );
}
