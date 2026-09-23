import type { ReactNode } from "react";
import { create } from "zustand";

export interface ConfirmRequest {
  title: string;
  text?: ReactNode;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  dismissible?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmState {
  request: ConfirmRequest | null;
  openConfirm: (request: ConfirmRequest) => void;
  closeConfirm: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  request: null,
  openConfirm: (request) => set({ request }),
  closeConfirm: () => set({ request: null }),
}));

export function confirm(request: ConfirmRequest): void {
  useConfirmStore.getState().openConfirm(request);
}