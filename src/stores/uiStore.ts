import { create } from 'zustand';
import type { OverlayType, OverlayDataMap } from '../types/game.ts';

type AnyOverlayData = OverlayDataMap[keyof OverlayDataMap];

interface UIState {
  overlay: OverlayType;
  overlayData: AnyOverlayData;
  interactPrompt: string | null;
  interactObjectId: string | null;

  openOverlay: <T extends OverlayType>(type: T, ...args: Record<string, never> extends OverlayDataMap[T] ? [data?: OverlayDataMap[T]] : [data: OverlayDataMap[T]]) => void;
  closeOverlay: () => void;
  setInteractPrompt: (label: string | null, objectId: string | null) => void;
  getTypedData: <T extends OverlayType>() => OverlayDataMap[T];
}

export const useUIStore = create<UIState>((set, get) => ({
  overlay: 'none',
  overlayData: {} as AnyOverlayData,
  interactPrompt: null,
  interactObjectId: null,

  openOverlay: (type, ...args) => set({ overlay: type, overlayData: (args[0] ?? {}) as AnyOverlayData }),
  closeOverlay: () => set({ overlay: 'none', overlayData: {} as AnyOverlayData }),
  setInteractPrompt: (label, objectId) => set({ interactPrompt: label, interactObjectId: objectId }),
  getTypedData: <T extends OverlayType>() => get().overlayData as OverlayDataMap[T],
}));
