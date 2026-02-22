import { create } from 'zustand';
import type { Direction, NPCState, Mutation } from '../types/game.ts';
import { PLAYER_START, BASE_SLOT_COUNT } from '../data/townMap.ts';
import { NPC_BASES } from '../data/npcBases.ts';
import { TILE_SIZE } from '../utils/collision.ts';

export interface CarryingBrainrot {
  defId: string;
  mutation?: Mutation;
}

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
    buildingSlots: Array(BASE_SLOT_COUNT).fill(null) as (string | null)[],
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

const _initialNPCs = createInitialNPCs();

export const useWorldStore = create<WorldState>((set) => ({
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

  resetWorld: () => set({
    playerX: PLAYER_START.x,
    playerY: PLAYER_START.y,
    playerDir: 'down' as Direction,
    carryingBrainrot: null,
    npcs: createInitialNPCs(),
  }),
}));
