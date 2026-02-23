import { create } from 'zustand';
import { ALL_GEARS, GEAR_MAP } from '../data/gears.ts';
import { useGameStore } from './gameStore.ts';

export interface ActiveGearEffect {
  gearId: string;
  remainingSec: number;
}

interface GearState {
  cooldowns: Record<string, number>;
  activeEffects: ActiveGearEffect[];

  useGear: (gearId: string) => boolean;
  tickGears: (dt: number) => void;
  getUnlockedGears: () => typeof ALL_GEARS;
  isOnCooldown: (gearId: string) => boolean;
  getActiveEffect: (effect: string) => ActiveGearEffect | undefined;
  hasActiveEffect: (effect: string) => boolean;
  getEffectValue: (effect: string) => number;
  resetGears: () => void;
}

export const useGearStore = create<GearState>((set, get) => ({
  cooldowns: {},
  activeEffects: [],

  useGear: (gearId) => {
    const gear = GEAR_MAP.get(gearId);
    if (!gear) return false;

    const game = useGameStore.getState();
    if (game.rebirthLevel < gear.rebirthRequired) return false;
    if ((get().cooldowns[gearId] ?? 0) > 0) return false;
    if (!game.spendCurrency(gear.cost)) return false;

    if (gear.effect === 'shield_instant') {
      if (game.activateShield()) {
        set(s => ({
          cooldowns: { ...s.cooldowns, [gearId]: gear.cooldownSec },
        }));
        return true;
      }
      return false;
    }

    set(s => ({
      cooldowns: { ...s.cooldowns, [gearId]: gear.cooldownSec },
      activeEffects: [...s.activeEffects, { gearId, remainingSec: gear.durationSec }],
    }));
    return true;
  },

  tickGears: (dt) => set(s => {
    const cooldowns: Record<string, number> = {};
    for (const key of Object.keys(s.cooldowns)) {
      const remaining = s.cooldowns[key] - dt;
      if (remaining > 0) cooldowns[key] = remaining;
    }

    const activeEffects = s.activeEffects
      .map(e => ({ ...e, remainingSec: e.remainingSec - dt }))
      .filter(e => e.remainingSec > 0);

    return { cooldowns, activeEffects };
  }),

  getUnlockedGears: () => {
    const level = useGameStore.getState().rebirthLevel;
    return ALL_GEARS.filter(g => g.rebirthRequired <= level);
  },

  isOnCooldown: (gearId) => (get().cooldowns[gearId] ?? 0) > 0,

  getActiveEffect: (effect) => {
    const state = get();
    return state.activeEffects.find(e => {
      const gear = GEAR_MAP.get(e.gearId);
      return gear?.effect === effect;
    });
  },

  hasActiveEffect: (effect) => !!get().getActiveEffect(effect),

  getEffectValue: (effect) => {
    const state = get();
    let best = 0;
    for (const e of state.activeEffects) {
      const gear = GEAR_MAP.get(e.gearId);
      if (gear?.effect === effect && gear.effectValue > best) {
        best = gear.effectValue;
      }
    }
    return best;
  },

  resetGears: () => set({ cooldowns: {}, activeEffects: [] }),
}));
