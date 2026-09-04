import { create } from "zustand";

export interface GuideStep {
  id: string;
  anchor: string;
  title: string;
  text: string;
  padding?: number;
  delayMs?: number;
}

interface GuideState {
  queue: GuideStep[];
  pushGuide: (step: GuideStep) => void;
  dismissTop: () => void;
  clearGuides: () => void;
}

export const useGuideStore = create<GuideState>((set) => ({
  queue: [],
  pushGuide: (step) => {
    set((state) =>
      state.queue.some((queued) => queued.id === step.id)
        ? state
        : { queue: [...state.queue, step] },
    );
  },
  dismissTop: () => set((state) => ({ queue: state.queue.slice(1) })),
  clearGuides: () => set({ queue: [] }),
}));

export const pushGuide = (step: GuideStep): void => {
  useGuideStore.getState().pushGuide(step);
};
