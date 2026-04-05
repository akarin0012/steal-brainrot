import type { OverlayType } from '../types/game.ts';

export type MenuOverlayHotkey = Extract<
  OverlayType,
  'rebirth' | 'collection' | 'event_center' | 'redeem'
>;

export interface MenuHotkeyEntry {
  code: string;
  shortcutLabel: string;
  overlay: MenuOverlayHotkey;
  buttonLabel: string;
  buttonClass: string;
}

/** Keyboard codes and HUD buttons for menu overlays (single source of truth). */
export const MENU_HOTKEY_ENTRIES: MenuHotkeyEntry[] = [
  {
    code: 'KeyR',
    shortcutLabel: 'R',
    overlay: 'rebirth',
    buttonLabel: 'Rebirth',
    buttonClass: 'bg-purple-600 hover:bg-purple-500',
  },
  {
    code: 'KeyC',
    shortcutLabel: 'C',
    overlay: 'collection',
    buttonLabel: 'Collection',
    buttonClass: 'bg-amber-700 hover:bg-amber-600',
  },
  {
    code: 'KeyE',
    shortcutLabel: 'E',
    overlay: 'event_center',
    buttonLabel: 'Events',
    buttonClass: 'bg-blue-700 hover:bg-blue-600',
  },
  {
    code: 'KeyX',
    shortcutLabel: 'X',
    overlay: 'redeem',
    buttonLabel: 'Redeem',
    buttonClass: 'bg-emerald-700 hover:bg-emerald-600',
  },
];

export const DEBUG_OVERLAY_CODE = 'KeyB' as const;
