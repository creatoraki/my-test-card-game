import { create } from "zustand";

interface BattleToastState {
  text: string | null;
  seq: number;
}

const useStore = create<BattleToastState>(() => ({ text: null, seq: 0 }));

export const showBattleToast = (text: string): void =>
  useStore.setState((state) => ({ text, seq: state.seq + 1 }));

export const clearBattleToast = (): void => useStore.setState({ text: null });

export const useBattleToast = (): { text: string | null; seq: number } => {
  const text = useStore((state) => state.text);
  const seq = useStore((state) => state.seq);
  return { text, seq };
};