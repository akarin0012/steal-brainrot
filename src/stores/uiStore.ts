import { create } from 'zustand';
import type { OverlayType } from '../types/game.ts';

interface UIState {
  overlay: OverlayType;
  overlayData: Record<string, unknown>;
  interactPrompt: string | null;
  interactObjectId: string | null;

  openOverlay: (type: OverlayType, data?: Record<string, unknown>) => void;
  closeOverlay: () => void;
  setInteractPrompt: (label: string | null, objectId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  overlay: 'none',
  overlayData: {},
  interactPrompt: null,
  interactObjectId: null,

  openOverlay: (type, data = {}) => set({ overlay: type, overlayData: data }),
  closeOverlay: () => set({ overlay: 'none', overlayData: {} }),
  setInteractPrompt: (label, objectId) => set({ interactPrompt: label, interactObjectId: objectId }),
}));
