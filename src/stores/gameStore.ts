import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OwnedBrainrot, CollectionEntry, Rarity } from '../types/game.ts';
import { ALL_BRAINROTS, BRAINROT_MAP } from '../data/brainrots.ts';
import { getMutationMultiplier, MUTATION_ORDER } from '../data/mutations.ts';
import { UPGRADES } from '../data/upgrades.ts';
import { BASE_SLOT_COUNT, MAX_SLOT_COUNT } from '../data/townMap.ts';

const UPGRADE_MAP = new Map(UPGRADES.map(u => [u.id, u]));
const VALID_MUTATIONS = new Set<string>(MUTATION_ORDER);

function clampFinite(val: unknown, fallback: number, min = 0, max = Infinity): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

function sanitizeOwnedBrainrots(raw: unknown[]): OwnedBrainrot[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.filter((b): b is OwnedBrainrot => {
    if (!b || typeof b !== 'object') return false;
    const obj = b as Record<string, unknown>;
    if (typeof obj.defId !== 'string' || !BRAINROT_MAP.has(obj.defId)) return false;
    if (typeof obj.instanceId !== 'string' || !obj.instanceId) return false;
    if (seen.has(obj.instanceId)) return false;
    seen.add(obj.instanceId);
    if (obj.mutation !== undefined && !VALID_MUTATIONS.has(obj.mutation as string)) {
      obj.mutation = undefined;
    }
    return true;
  });
}

function sanitizeUpgradeLevels(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const upgDef = UPGRADE_MAP.get(key);
    if (!upgDef) continue;
    const level = clampFinite(val, 0, 0, upgDef.maxLevel);
    if (level > 0) result[key] = Math.floor(level);
  }
  return result;
}

interface ShieldState {
  active: boolean;
  remainingSec: number;
  cooldownSec: number;
}

interface GameState {
  currency: number;
  incomePerSec: number;
  ownedBrainrots: OwnedBrainrot[];
  buildingSlots: (string | null)[];
  rebirthLevel: number;
  rebirthMultiplier: number;
  upgradeLevels: Record<string, number>;
  collection: CollectionEntry[];
  shield: ShieldState;
  lastSaveTime: number;

  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  addBrainrot: (brainrot: OwnedBrainrot) => void;
  removeBrainrot: (instanceId: string) => void;
  assignSlot: (slotIndex: number, instanceId: string) => void;
  unassignSlot: (slotIndex: number) => void;
  clearSlot: (slotIndex: number) => void;
  hasEmptySlot: () => boolean;
  recalcIncome: () => void;
  performRebirth: () => void;
  upgradeItem: (upgradeId: string) => void;
  discoverBrainrot: (defId: string) => void;
  activateShield: () => boolean;
  extendShield: () => boolean;
  getShieldCost: () => number;
  tickShield: (dt: number) => void;
  setLastSaveTime: (t: number) => void;
  getRebirthRequirement: () => number;
  canRebirth: () => boolean;
  getUnlockedRarities: () => Rarity[];
  getShieldDuration: () => number;
  getShieldCooldownMax: () => number;
  getNPCDeterrent: () => number;
  getCarrySpeedBonus: () => number;
  getPlayerSlotCount: () => number;
}

export const REBIRTH_TABLE: { level: number; cost: number; multiplier: number }[] = [
  { level: 1,  cost: 10_000,              multiplier: 1.5 },
  { level: 2,  cost: 100_000,             multiplier: 2.0 },
  { level: 3,  cost: 1_000_000,           multiplier: 3.0 },
  { level: 4,  cost: 10_000_000,          multiplier: 4.0 },
  { level: 5,  cost: 50_000_000,          multiplier: 5.0 },
  { level: 6,  cost: 200_000_000,         multiplier: 6.5 },
  { level: 7,  cost: 1_000_000_000,       multiplier: 8.0 },
  { level: 8,  cost: 5_000_000_000,       multiplier: 10.0 },
  { level: 9,  cost: 20_000_000_000,      multiplier: 12.0 },
  { level: 10, cost: 100_000_000_000,     multiplier: 15.0 },
  { level: 11, cost: 500_000_000_000,     multiplier: 18.0 },
  { level: 12, cost: 2_000_000_000_000,   multiplier: 22.0 },
  { level: 13, cost: 10_000_000_000_000,  multiplier: 26.0 },
  { level: 14, cost: 50_000_000_000_000,  multiplier: 30.0 },
  { level: 15, cost: 100_000_000_000_000, multiplier: 35.0 },
  { level: 16, cost: 200_000_000_000_000, multiplier: 40.0 },
  { level: 17, cost: 400_000_000_000_000, multiplier: 45.0 },
  { level: 18, cost: 600_000_000_000_000, multiplier: 48.0 },
  { level: 19, cost: 800_000_000_000_000, multiplier: 52.0 },
  { level: 20, cost: 1_000_000_000_000_000, multiplier: 55.0 },
];

function buildInitialCollection(): CollectionEntry[] {
  return ALL_BRAINROTS.map(b => ({
    brainrotId: b.id,
    discovered: false,
    firstDiscoveredAt: null,
    timesObtained: 0,
  }));
}

export const useGameStore = create<GameState>()(persist((set, get) => ({
  currency: 200,
  incomePerSec: 0,
  ownedBrainrots: [],
  buildingSlots: Array(BASE_SLOT_COUNT).fill(null) as (string | null)[],
  rebirthLevel: 0,
  rebirthMultiplier: 1,
  upgradeLevels: {},
  collection: buildInitialCollection(),
  shield: { active: false, remainingSec: 0, cooldownSec: 0 },
  lastSaveTime: Date.now(),

  addCurrency: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    set(s => ({ currency: s.currency + amount }));
  },
  spendCurrency: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const s = get();
    if (s.currency < amount) return false;
    set({ currency: s.currency - amount });
    return true;
  },

  addBrainrot: (brainrot) => set(s => {
    const newOwned = [...s.ownedBrainrots, brainrot];
    const slots = [...s.buildingSlots];
    const emptyIdx = slots.indexOf(null);
    if (emptyIdx !== -1) {
      slots[emptyIdx] = brainrot.instanceId;
    }
    return { ownedBrainrots: newOwned, buildingSlots: slots };
  }),

  removeBrainrot: (instanceId) => set(s => ({
    ownedBrainrots: s.ownedBrainrots.filter(b => b.instanceId !== instanceId),
    buildingSlots: s.buildingSlots.map(id => id === instanceId ? null : id),
  })),

  assignSlot: (slotIndex, instanceId) => set(s => {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= s.buildingSlots.length) return {};
    if (!s.ownedBrainrots.some(b => b.instanceId === instanceId)) return {};
    const slots = [...s.buildingSlots];
    const prevSlot = slots.indexOf(instanceId);
    if (prevSlot !== -1) slots[prevSlot] = null;
    slots[slotIndex] = instanceId;
    return { buildingSlots: slots };
  }),

  unassignSlot: (slotIndex) => set(s => {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= s.buildingSlots.length) return {};
    const slots = [...s.buildingSlots];
    slots[slotIndex] = null;
    return { buildingSlots: slots };
  }),

  clearSlot: (slotIndex) => set(s => {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= s.buildingSlots.length) return {};
    const slots = [...s.buildingSlots];
    const instanceId = slots[slotIndex];
    slots[slotIndex] = null;
    return {
      buildingSlots: slots,
      ownedBrainrots: instanceId
        ? s.ownedBrainrots.filter(b => b.instanceId !== instanceId)
        : s.ownedBrainrots,
    };
  }),

  hasEmptySlot: () => {
    return get().buildingSlots.some(s => s === null);
  },

  recalcIncome: () => set(s => {
    let total = 0;
    for (const instId of s.buildingSlots) {
      if (!instId) continue;
      const owned = s.ownedBrainrots.find(b => b.instanceId === instId);
      if (!owned) continue;
      const def = BRAINROT_MAP.get(owned.defId);
      if (def) total += def.baseIncomePerSec * getMutationMultiplier(owned.mutation);
    }
    return { incomePerSec: total * s.rebirthMultiplier };
  }),

  performRebirth: () => {
    const s = get();
    const nextLevel = s.rebirthLevel + 1;
    const tier = REBIRTH_TABLE.find(t => t.level === nextLevel);
    if (!tier) return;
    if (s.currency < tier.cost) return;

    const newSlotCount = Math.min(BASE_SLOT_COUNT + nextLevel, MAX_SLOT_COUNT);
    set({
      currency: 200,
      ownedBrainrots: [],
      buildingSlots: Array(newSlotCount).fill(null) as (string | null)[],
      incomePerSec: 0,
      rebirthLevel: nextLevel,
      rebirthMultiplier: tier.multiplier,
      upgradeLevels: {},
      shield: { active: false, remainingSec: 0, cooldownSec: 0 },
    });
  },

  upgradeItem: (upgradeId) => {
    const s = get();
    const upgDef = UPGRADE_MAP.get(upgradeId);
    if (!upgDef) return;
    const currentLevel = s.upgradeLevels[upgradeId] ?? 0;
    if (currentLevel >= upgDef.maxLevel) return;

    const cost = Math.floor(upgDef.baseCost * Math.pow(upgDef.costMultiplier, currentLevel));
    if (!Number.isFinite(cost) || cost <= 0 || s.currency < cost) return;

    const newLevels = { ...s.upgradeLevels, [upgradeId]: currentLevel + 1 };
    const updates: Record<string, unknown> = { upgradeLevels: newLevels, currency: s.currency - cost };

    if (upgradeId === 'shield_duration' && s.shield.active) {
      updates.shield = { ...s.shield, remainingSec: s.shield.remainingSec + 15 };
    }

    if (upgradeId === 'shield_cooldown' && !s.shield.active && s.shield.cooldownSec > 0) {
      const newCdLevel = newLevels['shield_cooldown'] ?? 0;
      const newMax = Math.max(30, 120 + newCdLevel * -15);
      updates.shield = { ...s.shield, cooldownSec: Math.min(s.shield.cooldownSec, newMax) };
    }

    set(updates as Partial<GameState>);
  },

  discoverBrainrot: (defId) => set(s => ({
    collection: s.collection.map(c =>
      c.brainrotId === defId
        ? {
            ...c,
            discovered: true,
            firstDiscoveredAt: c.firstDiscoveredAt ?? Date.now(),
            timesObtained: c.timesObtained + 1,
          }
        : c
    ),
  })),

  getShieldCost: () => {
    const s = get();
    return Math.max(10_000, Math.floor(s.incomePerSec * 60));
  },

  activateShield: () => {
    const s = get();
    if (s.shield.active || s.shield.cooldownSec > 0) return false;
    const cost = get().getShieldCost();
    if (s.currency < cost) return false;
    set({
      currency: s.currency - cost,
      shield: { active: true, remainingSec: s.getShieldDuration(), cooldownSec: 0 },
    });
    return true;
  },

  extendShield: () => {
    const s = get();
    if (!s.shield.active) return false;
    const cost = get().getShieldCost();
    if (s.currency < cost) return false;
    set({
      currency: s.currency - cost,
      shield: { ...s.shield, remainingSec: s.shield.remainingSec + s.getShieldDuration() },
    });
    return true;
  },

  tickShield: (dt) => set(s => {
    if (!Number.isFinite(dt) || dt <= 0) return {};
    const shield = { ...s.shield };
    if (shield.active) {
      shield.remainingSec -= dt;
      if (shield.remainingSec <= 0) {
        shield.active = false;
        shield.remainingSec = 0;
        shield.cooldownSec = s.getShieldCooldownMax();
      }
    } else if (shield.cooldownSec > 0) {
      shield.cooldownSec = Math.max(0, shield.cooldownSec - dt);
    }
    return { shield };
  }),

  setLastSaveTime: (t) => {
    set({ lastSaveTime: t });
    try { localStorage.setItem('steal-brainrot-lastSave', String(t)); } catch {}
  },

  getRebirthRequirement: () => {
    const nextLevel = get().rebirthLevel + 1;
    const tier = REBIRTH_TABLE.find(t => t.level === nextLevel);
    return tier ? tier.cost : Infinity;
  },

  canRebirth: () => {
    const s = get();
    return s.currency >= s.getRebirthRequirement();
  },

  getUnlockedRarities: () => {
    const level = get().rebirthLevel;
    const all: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    if (level >= 5) all.push('mythic');
    if (level >= 7) all.push('secret');
    if (level >= 10) all.push('god');
    return all;
  },

  getShieldDuration: () => {
    const s = get();
    const base = 60 + s.rebirthLevel * 10;
    const upgradeLevel = s.upgradeLevels['shield_duration'] ?? 0;
    return base + upgradeLevel * 15;
  },

  getShieldCooldownMax: () => {
    const s = get();
    const upgradeLevel = s.upgradeLevels['shield_cooldown'] ?? 0;
    return Math.max(30, 120 + upgradeLevel * -15);
  },

  getNPCDeterrent: () => {
    const s = get();
    const upgradeLevel = s.upgradeLevels['npc_deterrent'] ?? 0;
    return Math.max(0.1, 1 + upgradeLevel * -0.3);
  },

  getCarrySpeedBonus: () => {
    const s = get();
    const upgradeLevel = s.upgradeLevels['carry_speed'] ?? 0;
    return upgradeLevel * 0.1;
  },

  getPlayerSlotCount: () => {
    return get().buildingSlots.length;
  },
}), {
  name: 'steal-brainrot-save',
  version: 1,
  partialize: (state) => ({
    currency: state.currency,
    incomePerSec: state.incomePerSec,
    ownedBrainrots: state.ownedBrainrots,
    buildingSlots: state.buildingSlots,
    rebirthLevel: state.rebirthLevel,
    rebirthMultiplier: state.rebirthMultiplier,
    upgradeLevels: state.upgradeLevels,
    collection: state.collection,
    shield: state.shield,
  }),
  merge: (persisted, current) => {
    const saved = persisted as Partial<GameState>;
    const merged = { ...current };

    const maxRebirth = REBIRTH_TABLE.length;
    const rebirthLevel = clampFinite(saved.rebirthLevel, 0, 0, maxRebirth);
    const rebirthTier = REBIRTH_TABLE.find(t => t.level === rebirthLevel);
    const rebirthMultiplier = rebirthTier ? rebirthTier.multiplier : (rebirthLevel === 0 ? 1 : 1);
    merged.rebirthLevel = Math.floor(rebirthLevel);
    merged.rebirthMultiplier = rebirthMultiplier;
    merged.currency = clampFinite(saved.currency, 200, 0);
    merged.upgradeLevels = sanitizeUpgradeLevels(saved.upgradeLevels);
    merged.ownedBrainrots = sanitizeOwnedBrainrots(saved.ownedBrainrots as unknown[]);

    if (typeof saved.shield === 'object' && saved.shield) {
      merged.shield = {
        active: !!saved.shield.active,
        remainingSec: clampFinite(saved.shield.remainingSec, 0, 0, 7200),
        cooldownSec: clampFinite(saved.shield.cooldownSec, 0, 0, 300),
      };
    }

    const expectedSlots = Math.min(BASE_SLOT_COUNT + merged.rebirthLevel, MAX_SLOT_COUNT);
    let slots = Array.isArray(saved.buildingSlots) ? [...saved.buildingSlots] : [];
    if (slots.length < expectedSlots) {
      slots = [...slots, ...Array(expectedSlots - slots.length).fill(null)];
    } else if (slots.length > expectedSlots) {
      slots = slots.slice(0, expectedSlots);
    }

    const ownedIds = new Set(merged.ownedBrainrots.map(b => b.instanceId));
    const seen = new Set<string>();
    merged.buildingSlots = slots.map(id => {
      if (id === null || typeof id !== 'string') return null;
      if (!ownedIds.has(id) || seen.has(id)) return null;
      seen.add(id);
      return id;
    });

    const savedCollection = saved.collection ?? [];
    const savedMap = new Map(
      (Array.isArray(savedCollection) ? savedCollection : []).map(c => [c.brainrotId, c]),
    );
    merged.collection = ALL_BRAINROTS.map(b =>
      savedMap.get(b.id) ?? { brainrotId: b.id, discovered: false, firstDiscoveredAt: null, timesObtained: 0 },
    );

    let totalIncome = 0;
    const ownedLookup = new Map(merged.ownedBrainrots.map(b => [b.instanceId, b]));
    for (const instId of merged.buildingSlots) {
      if (!instId) continue;
      const owned = ownedLookup.get(instId);
      if (!owned) continue;
      const def = BRAINROT_MAP.get(owned.defId);
      if (def) totalIncome += def.baseIncomePerSec * getMutationMultiplier(owned.mutation);
    }
    merged.incomePerSec = totalIncome * merged.rebirthMultiplier;

    return merged;
  },
}));
