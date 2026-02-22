import { create } from 'zustand';
import type { Direction, NPCState, NPCSlotItem, Mutation } from '../types/game.ts';
import { PLAYER_START, BASE_SLOT_COUNT } from '../data/townMap.ts';
import { NPC_BASES } from '../data/npcBases.ts';
import { TILE_SIZE } from '../utils/collision.ts';
import { BRAINROT_MAP } from '../data/brainrots.ts';
import { MUTATION_ORDER } from '../data/mutations.ts';

const VALID_MUTATION_SET = new Set<string>(MUTATION_ORDER);

export interface CarryingBrainrot {
  defId: string;
  mutation?: Mutation;
  instanceId?: string;
  source?: 'conveyor' | 'steal';
}

interface SavedNPCData {
  buildingSlots: (NPCSlotItem | null)[];
  currency: number;
  incomePerSec: number;
}

const NPC_SAVE_KEY = 'steal-brainrot-npc-state';

interface WorldState {
  playerX: number;
  playerY: number;
  playerDir: Direction;
  carryingBrainrot: CarryingBrainrot | null;
  npcs: NPCState[];

  setPlayerPos: (x: number, y: number) => void;
  setPlayerDir: (dir: Direction) => void;
  setCarrying: (brainrot: CarryingBrainrot | null) => void;
  setNPCs: (npcs: NPCState[]) => void;
  updateNPC: (id: string, partial: Partial<NPCState>) => void;
  saveNPCState: () => void;
  resetWorld: () => void;
}

export function createInitialNPCs(): NPCState[] {
  return NPC_BASES.map(base => ({
    id: `npc_${base.id}`,
    baseId: base.id,
    x: base.entranceCol * TILE_SIZE + 4,
    y: (base.entranceRow + (base.entranceRow < 15 ? -1 : 1)) * TILE_SIZE + 4,
    direction: (base.entranceRow < 15 ? 'down' : 'up') as Direction,
    state: 'idle' as const,
    currency: base.initialCurrency,
    carryingDefId: null,
    buildingSlots: Array(BASE_SLOT_COUNT).fill(null) as (NPCSlotItem | null)[],
    incomePerSec: 0,
    stateTimer: 0,
    pauseTimer: 0,
    npcStealTimer: 45 + Math.random() * 35,
    npcStealTarget: null,
    pendingChase: null,
    waypoints: [] as { x: number; y: number }[],
    waypointIndex: 0,
  }));
}

function isValidSlotItem(v: unknown): v is NPCSlotItem | null {
  if (v === null) return true;
  if (typeof v !== 'object' || v === undefined) return false;
  const obj = v as Record<string, unknown>;
  if (typeof obj.defId !== 'string' || !BRAINROT_MAP.has(obj.defId)) return false;
  if (obj.mutation !== undefined && obj.mutation !== null && !VALID_MUTATION_SET.has(obj.mutation as string)) return false;
  return true;
}

function loadNPCsWithSavedState(): NPCState[] {
  const fresh = createInitialNPCs();
  try {
    const raw = localStorage.getItem(NPC_SAVE_KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw);
    if (typeof saved !== 'object' || saved === null) return fresh;
    return fresh.map(npc => {
      const data = saved[npc.id];
      if (!data || typeof data !== 'object') return npc;

      const slots = Array.isArray(data.buildingSlots)
        ? data.buildingSlots.map((s: unknown) => isValidSlotItem(s) ? s : null)
        : npc.buildingSlots;
      while (slots.length < BASE_SLOT_COUNT) slots.push(null);
      if (slots.length > BASE_SLOT_COUNT) slots.length = BASE_SLOT_COUNT;

      const currency = typeof data.currency === 'number' && Number.isFinite(data.currency) && data.currency >= 0
        ? data.currency : npc.currency;
      const incomePerSec = typeof data.incomePerSec === 'number' && Number.isFinite(data.incomePerSec) && data.incomePerSec >= 0
        ? data.incomePerSec : npc.incomePerSec;

      return { ...npc, buildingSlots: slots, currency, incomePerSec };
    });
  } catch {
    return fresh;
  }
}

const _initialNPCs = loadNPCsWithSavedState();

export const useWorldStore = create<WorldState>((set, get) => ({
  playerX: PLAYER_START.x,
  playerY: PLAYER_START.y,
  playerDir: 'down',
  carryingBrainrot: null,
  npcs: _initialNPCs,

  setPlayerPos: (x, y) => set({ playerX: x, playerY: y }),

  setPlayerDir: (dir) => set({ playerDir: dir }),

  setCarrying: (brainrot) => set({ carryingBrainrot: brainrot }),

  setNPCs: (npcs) => set({ npcs }),

  updateNPC: (id, partial) => set(s => ({
    npcs: (s.npcs ?? _initialNPCs).map(npc => npc.id === id ? { ...npc, ...partial } : npc),
  })),

  saveNPCState: () => {
    const data: Record<string, SavedNPCData> = {};
    for (const npc of get().npcs) {
      data[npc.id] = {
        buildingSlots: npc.buildingSlots,
        currency: npc.currency,
        incomePerSec: npc.incomePerSec,
      };
    }
    try { localStorage.setItem(NPC_SAVE_KEY, JSON.stringify(data)); } catch { /* ignored */ }
  },

  resetWorld: () => {
    try { localStorage.removeItem(NPC_SAVE_KEY); } catch { /* ignored */ }
    set({
      playerX: PLAYER_START.x,
      playerY: PLAYER_START.y,
      playerDir: 'down' as Direction,
      carryingBrainrot: null,
      npcs: createInitialNPCs(),
    });
  },
}));
