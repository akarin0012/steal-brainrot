import type { NPCState, NPCBehaviorState, Direction, NPCBaseDef, Mutation, NPCSlotItem } from '../types/game.ts';
import { NPC_BASE_MAP } from '../data/npcBases.ts';
import { BRAINROT_MAP } from '../data/brainrots.ts';
import { RARITY_ORDER } from '../data/rarities.ts';
import { getMutationMultiplier } from '../data/mutations.ts';
import { TILE_SIZE, isWalkableRect } from '../utils/collision.ts';
import { CONVEYOR_ROW, TOWN_MAP, TILE_DEFS, HOME_BOUNDS } from '../data/townMap.ts';
import { useWorldStore } from '../stores/worldStore.ts';
import { useGameStore } from '../stores/gameStore.ts';
import { useGearStore } from '../stores/gearStore.ts';
import { getConveyorItems, removeConveyorItem } from './conveyor.ts';

const WAYPOINT_THRESHOLD = 4;
const NPC_SIZE = 24;
const CARRY_SPEED_MULT = 0.8;
const STEAL_MIN_RARITY_IDX = 3; // epic

function calcSlotsIncome(slots: (NPCSlotItem | null)[]): number {
  let income = 0;
  for (const slot of slots) {
    if (!slot) continue;
    const def = BRAINROT_MAP.get(slot.defId);
    if (def) income += def.baseIncomePerSec * getMutationMultiplier(slot.mutation);
  }
  return income;
}

function insertItemIntoSlot(slots: (NPCSlotItem | null)[], preferredIdx: number, item: NPCSlotItem): void {
  if (!slots[preferredIdx]) {
    slots[preferredIdx] = item;
    return;
  }
  const empty = slots.indexOf(null);
  if (empty !== -1) {
    slots[empty] = item;
    return;
  }
  const restoredDef = BRAINROT_MAP.get(item.defId);
  const restoredIncome = restoredDef ? restoredDef.baseIncomePerSec * getMutationMultiplier(item.mutation) : 0;
  let worstIdx = -1;
  let worstIncome = Infinity;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (!s) continue;
    const d = BRAINROT_MAP.get(s.defId);
    const inc = d ? d.baseIncomePerSec * getMutationMultiplier(s.mutation) : 0;
    if (inc < worstIncome) { worstIncome = inc; worstIdx = i; }
  }
  if (worstIdx !== -1 && restoredIncome > worstIncome) {
    slots[worstIdx] = item;
  }
}

function buildGoHomeState(npc: NPCState, extra?: Partial<NPCState>): NPCState {
  const base = NPC_BASE_MAP.get(npc.baseId)!;
  return {
    ...npc,
    state: 'carrying_home' as NPCBehaviorState,
    stateTimer: 0,
    waypoints: buildSafeReturnToBase(base, npc.x, npc.y),
    waypointIndex: 0,
    ...extra,
  };
}

function buildNPCHomePos(npc: NPCState): { x: number; y: number } {
  const base = NPC_BASE_MAP.get(npc.baseId)!;
  const isUpper = base.entranceRow < CONVEYOR_ROW;
  const interiorRow = isUpper ? base.buildingBounds.minRow + 1 : base.buildingBounds.maxRow - 1;
  return tc(base.pathCol, interiorRow);
}

type PendingNPCSteal = { targetId: string; slotIdx: number; defId: string; mutation?: Mutation };
type PendingNPCChase = { victimId: string; thiefId: string; stolenSlotIdx: number; stolenDefId: string; stolenMutation?: Mutation };
type PendingNPCCatch = { thiefId: string; victimId: string; stolenDefId: string; stolenSlotIdx: number; stolenMutation?: Mutation };
let _pendingNPCSteals: PendingNPCSteal[] = [];
let _pendingChases: PendingNPCChase[] = [];
let _pendingCatches: PendingNPCCatch[] = [];
let _pendingPlayerCatches: { stolenDefId: string; stolenSlotIdx: number; stolenMutation?: Mutation; stolenInstanceId?: string }[] = [];
const _npcStolenFromPlayer = new Map<string, { slotIdx: number; defId: string; mutation?: Mutation; instanceId?: string }>();

export function tickNPCs(dt: number) {
  const world = useWorldStore.getState();
  const npcs = world.npcs;
  if (!Array.isArray(npcs)) return;

  if (useGearStore.getState().hasActiveEffect('npc_stun')) {
    return;
  }

  _pendingNPCSteals = [];
  _pendingChases = [];
  _pendingCatches = [];
  _pendingPlayerCatches = [];
  let updated = npcs.map(npc => tickSingleNPC(npc, dt));

  for (const steal of _pendingNPCSteals) {
    updated = updated.map(npc => {
      if (npc.id !== steal.targetId) return npc;
      const slot = npc.buildingSlots[steal.slotIdx];
      if (!slot || slot.defId !== steal.defId || slot.mutation !== steal.mutation) return npc;
      const slots = [...npc.buildingSlots];
      slots[steal.slotIdx] = null;
      return { ...npc, buildingSlots: slots, incomePerSec: calcSlotsIncome(slots) };
    });
  }

  for (const chase of _pendingChases) {
    updated = updated.map(npc => {
      if (npc.id !== chase.victimId) return npc;
      const chaseInfo = { thiefId: chase.thiefId, stolenSlotIdx: chase.stolenSlotIdx, stolenDefId: chase.stolenDefId, stolenMutation: chase.stolenMutation };
      if (npc.carryingDefId) {
        return buildGoHomeState(npc, { pendingChase: chaseInfo });
      }
      return {
        ...npc,
        state: 'chasing_thief' as NPCBehaviorState,
        stateTimer: 0,
        pendingChase: chaseInfo,
        waypoints: [],
        waypointIndex: 0,
      };
    });
  }

  for (const c of _pendingCatches) {
    _npcStolenFromPlayer.delete(c.thiefId);
    updated = updated.map(npc => {
      if (npc.id === c.thiefId) {
        const pos = buildNPCHomePos(npc);
        const slots = [...npc.buildingSlots];
        if (!npc.carryingDefId) {
          const idx = slots.findIndex(s => s?.defId === c.stolenDefId && s?.mutation === c.stolenMutation);
          if (idx !== -1) slots[idx] = null;
        }
        return {
          ...npc,
          x: pos.x, y: pos.y,
          state: 'idle' as NPCBehaviorState,
          stateTimer: 0,
          carryingDefId: null,
          carryingMutation: undefined,
          buildingSlots: slots,
          incomePerSec: calcSlotsIncome(slots),
          waypoints: [],
          waypointIndex: 0,
          pendingChase: null,
        };
      }
      if (npc.id === c.victimId) {
        const slots = [...npc.buildingSlots];
        insertItemIntoSlot(slots, c.stolenSlotIdx, { defId: c.stolenDefId, mutation: c.stolenMutation });
        return { ...npc, buildingSlots: slots, incomePerSec: calcSlotsIncome(slots), pendingChase: null };
      }
      return npc;
    });
  }

  world.setNPCs(updated);

  for (const pc of _pendingPlayerCatches) {
    const w = useWorldStore.getState();
    const carrying = w.carryingBrainrot;
    if (!carrying) break;
    const match = carrying.defId === pc.stolenDefId
      && carrying.mutation === pc.stolenMutation
      && (!pc.stolenInstanceId || !carrying.instanceId || carrying.instanceId === pc.stolenInstanceId);
    if (match) {
      w.setCarrying(null);
    }
  }
}

function tickSingleNPC(npc: NPCState, dt: number): NPCState {
  const base = NPC_BASE_MAP.get(npc.baseId);
  if (!base) return npc;

  let n = { ...npc, stateTimer: npc.stateTimer + dt, npcStealTimer: npc.npcStealTimer - dt };

  switch (n.state) {
    case 'idle':
      n = tickIdle(n);
      break;
    case 'going_to_conveyor':
      n = tickMoving(n, dt, 'roaming');
      if (n.state === 'roaming') {
        n = { ...n, waypoints: buildRoamWaypoints(n), waypointIndex: 0 };
      }
      break;
    case 'roaming':
      n = tickRoaming(n, dt);
      break;
    case 'carrying_home':
      n = tickMoving(n, dt, 'idle');
      if (n.carryingDefId) {
        const b = base.buildingBounds;
        const tx = Math.floor((n.x + NPC_SIZE / 2) / TILE_SIZE);
        const ty = Math.floor((n.y + NPC_SIZE / 2) / TILE_SIZE);
        if (tx >= b.minCol && tx <= b.maxCol && ty >= b.minRow && ty <= b.maxRow) {
          n = deliverToSlot(n);
        }
      }
      if (n.state === 'idle' && n.carryingDefId) {
        n = deliverToSlot(n);
      }
      break;
    case 'steal_attempt':
      n = tickStealAttempt(n, dt);
      break;
    case 'npc_steal':
      n = tickNPCSteal(n, dt);
      break;
    case 'chasing_thief':
      n = tickChasingThief(n, dt);
      break;
  }

  return n;
}

function tickIdle(npc: NPCState): NPCState {
  const base = NPC_BASE_MAP.get(npc.baseId)!;

  if (npc.stateTimer < base.buyInterval) return npc;

  const hasEmpty = npc.buildingSlots.some(s => s === null);
  const game = useGameStore.getState();
  const deterrent = game.getNPCDeterrent();
  const shieldActive = game.shield.active;

  if (!shieldActive && !isPlayerAtHome() && Math.random() < base.stealChance * deterrent) {
    const minIncome = getThiefMinIncomeThreshold(npc);
    const ownedMap = new Map(game.ownedBrainrots.map(b => [b.instanceId, b]));
    const hasStealableItems = game.buildingSlots.some(instanceId => {
      if (!instanceId) return false;
      const owned = ownedMap.get(instanceId);
      if (!owned) return false;
      const def = BRAINROT_MAP.get(owned.defId);
      if (!def) return false;
      if (RARITY_ORDER.indexOf(def.rarity) < STEAL_MIN_RARITY_IDX) return false;
      return def.baseIncomePerSec * getMutationMultiplier(owned.mutation) > minIncome;
    });
    if (hasStealableItems) {
      return {
        ...npc,
        state: 'steal_attempt',
        stateTimer: 0,
        waypoints: buildStealWaypoints(npc.x, npc.y),
        waypointIndex: 0,
      };
    }
  }

  if (npc.npcStealTimer <= 0 && !npc.carryingDefId) {
    const npcCandidates = findNPCStealCandidates(npc);
    const playerValid = isPlayerValidStealTarget(npc);
    const totalCandidates = npcCandidates.length + (playerValid ? 1 : 0);

    if (totalCandidates > 0) {
      const pick = Math.floor(Math.random() * totalCandidates);

      if (playerValid && pick === totalCandidates - 1) {
        return {
          ...npc,
          state: 'steal_attempt',
          stateTimer: 0,
          npcStealTimer: 45 + Math.random() * 35,
          waypoints: buildStealWaypoints(npc.x, npc.y),
          waypointIndex: 0,
        };
      }

      const chosen = npcCandidates[pick];
      const targetBase = NPC_BASE_MAP.get(chosen.baseId)!;
      return {
        ...npc,
        state: 'npc_steal',
        stateTimer: 0,
        npcStealTimer: 45 + Math.random() * 35,
        npcStealTarget: chosen.id,
        waypoints: buildNPCToNPCWaypoints(npc.x, npc.y, targetBase),
        waypointIndex: 0,
      };
    }
    npc = { ...npc, npcStealTimer: 45 + Math.random() * 35 };
  }

  if (npc.currency >= 10 && (hasEmpty || getWeakestSlotIncome(npc) !== null)) {
    return {
      ...npc,
      state: 'going_to_conveyor',
      stateTimer: 0,
      waypoints: buildConveyorWaypoints(npc.x, npc.y),
      waypointIndex: 0,
    };
  }

  return { ...npc, stateTimer: 0 };
}

function getWeakestSlotIncome(npc: NPCState): { index: number; income: number } | null {
  let weakest: { index: number; income: number } | null = null;
  for (let i = 0; i < npc.buildingSlots.length; i++) {
    const slot = npc.buildingSlots[i];
    if (!slot) return null;
    const def = BRAINROT_MAP.get(slot.defId);
    const inc = def ? def.baseIncomePerSec * getMutationMultiplier(slot.mutation) : 0;
    if (!weakest || inc < weakest.income) {
      weakest = { index: i, income: inc };
    }
  }
  return weakest;
}

function tickMoving(npc: NPCState, dt: number, arrivalState: NPCBehaviorState): NPCState {
  if (npc.waypointIndex >= npc.waypoints.length) {
    return { ...npc, state: arrivalState, stateTimer: 0, waypoints: [], waypointIndex: 0 };
  }

  const base = NPC_BASE_MAP.get(npc.baseId)!;
  const speed = npc.carryingDefId ? base.moveSpeed * CARRY_SPEED_MULT : base.moveSpeed;
  const target = npc.waypoints[npc.waypointIndex];

  const dx = target.x - npc.x;
  const dy = target.y - npc.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < WAYPOINT_THRESHOLD) {
    return { ...npc, x: target.x, y: target.y, waypointIndex: npc.waypointIndex + 1 };
  }

  const step = speed * dt;
  const ratio = Math.min(step / dist, 1);

  let newX = npc.x + dx * ratio;
  let newY = npc.y + dy * ratio;

  if (!isWalkableRect(TOWN_MAP, TILE_DEFS, newX, newY, NPC_SIZE, NPC_SIZE)) {
    if (isWalkableRect(TOWN_MAP, TILE_DEFS, newX, npc.y, NPC_SIZE, NPC_SIZE)) {
      newY = npc.y;
    } else if (isWalkableRect(TOWN_MAP, TILE_DEFS, npc.x, newY, NPC_SIZE, NPC_SIZE)) {
      newX = npc.x;
    } else {
      return { ...npc, waypointIndex: npc.waypointIndex + 1 };
    }
  }

  let dir: Direction = npc.direction;
  if (Math.abs(dx) > Math.abs(dy)) {
    dir = dx > 0 ? 'right' : 'left';
  } else if (Math.abs(dy) > 0) {
    dir = dy > 0 ? 'down' : 'up';
  }

  return { ...npc, x: newX, y: newY, direction: dir };
}

function tickRoaming(npc: NPCState, dt: number): NPCState {
  if (npc.stateTimer > 40) {
    return buildGoHomeState(npc, { pauseTimer: 0 });
  }

  const grabbed = tryGrabConveyorItem(npc);
  if (grabbed) return grabbed;

  if (npc.pauseTimer > 0) {
    return { ...npc, pauseTimer: npc.pauseTimer - dt };
  }

  if (npc.waypointIndex >= npc.waypoints.length) {
    const pause = 0.5 + Math.random() * 2.0;
    return { ...npc, waypoints: buildRoamWaypoints(npc), waypointIndex: 0, pauseTimer: pause };
  }

  const prev = npc.waypointIndex;
  const moved = tickMoving(npc, dt, 'roaming');

  if (moved.waypointIndex > prev && Math.random() < 0.4) {
    return { ...moved, pauseTimer: 0.8 + Math.random() * 1.5 };
  }

  return moved;
}

function tryGrabConveyorItem(npc: NPCState): NPCState | null {
  const items = getConveyorItems();
  const npcCX = npc.x + NPC_SIZE / 2;
  const npcCY = npc.y + NPC_SIZE / 2;
  const beltCY = CONVEYOR_ROW * TILE_SIZE + TILE_SIZE * 0.5;

  if (Math.abs(npcCY - beltCY) > TILE_SIZE * 1.5) return null;

  const hasEmpty = npc.buildingSlots.some(s => s === null);
  const weakest = hasEmpty ? null : getWeakestSlotIncome(npc);

  let bestItem: typeof items[number] | null = null;
  let bestIncome = -1;

  const base = NPC_BASE_MAP.get(npc.baseId);
  const minRarityIdx = base ? RARITY_ORDER.indexOf(base.preferMinRarity) : 0;
  const maxRarityIdx = base ? RARITY_ORDER.indexOf(base.preferMaxRarity) : RARITY_ORDER.length - 1;

  for (const item of items) {
    const dist = Math.abs(item.x - npcCX);
    if (dist > TILE_SIZE * 1.5) continue;
    if (item.cost > npc.currency) continue;

    const def = BRAINROT_MAP.get(item.defId);
    if (!def) continue;

    const rarityIdx = RARITY_ORDER.indexOf(def.rarity);
    if (rarityIdx < minRarityIdx || rarityIdx > maxRarityIdx) continue;

    const effectiveIncome = def.baseIncomePerSec * getMutationMultiplier(item.mutation);
    if (!hasEmpty && weakest && effectiveIncome <= weakest.income) continue;

    if (effectiveIncome > bestIncome) {
      bestIncome = effectiveIncome;
      bestItem = item;
    }
  }

  if (!bestItem) return null;

  const removed = removeConveyorItem(bestItem.id);
  if (!removed) return null;

  return buildGoHomeState(npc, {
    currency: npc.currency - bestItem.cost,
    carryingDefId: removed.def.id,
    carryingMutation: removed.mutation,
    pauseTimer: 0,
  });
}

function buildRoamWaypoints(npc: NPCState): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const currentCol = Math.round((npc.x + NPC_SIZE / 2) / TILE_SIZE);
  const currentRow = Math.round((npc.y + NPC_SIZE / 2) / TILE_SIZE);

  const steps = 2 + Math.floor(Math.random() * 3);
  let col = currentCol;
  let row = currentRow;

  for (let i = 0; i < steps; i++) {
    const r = Math.random();
    if (r < 0.5) {
      const delta = Math.random() < 0.5 ? -3 : 3;
      col = Math.max(2, Math.min(47, col + Math.round(delta + (Math.random() - 0.5) * 4)));
      pts.push(tc(col, row));
    } else if (r < 0.8) {
      const delta = Math.random() < 0.5 ? -2 : 2;
      row = Math.max(CONVEYOR_ROW - 3, Math.min(CONVEYOR_ROW + 3, row + delta));
      pts.push(tc(col, row));
    } else {
      col = Math.max(2, Math.min(47, col + Math.round((Math.random() - 0.5) * 8)));
      row = Math.max(CONVEYOR_ROW - 2, Math.min(CONVEYOR_ROW + 2, row + (Math.random() < 0.5 ? -1 : 1)));
      pts.push(tc(col, row));
    }
  }

  return pts;
}

function getThiefMinIncomeThreshold(npc: NPCState): number {
  const hasEmpty = npc.buildingSlots.some(s => s === null);
  if (hasEmpty) return 0;
  let worstIncome = Infinity;
  for (const slot of npc.buildingSlots) {
    if (!slot) continue;
    const def = BRAINROT_MAP.get(slot.defId);
    const inc = def ? def.baseIncomePerSec * getMutationMultiplier(slot.mutation) : 0;
    if (inc < worstIncome) worstIncome = inc;
  }
  return worstIncome;
}

function findNPCStealCandidates(npc: NPCState): NPCState[] {
  const world = useWorldStore.getState();
  const minIncome = getThiefMinIncomeThreshold(npc);
  return world.npcs.filter(other => {
    if (other.id === npc.id) return false;
    return other.buildingSlots.some(slot => {
      if (!slot) return false;
      const def = BRAINROT_MAP.get(slot.defId);
      if (!def) return false;
      if (RARITY_ORDER.indexOf(def.rarity) < STEAL_MIN_RARITY_IDX) return false;
      return def.baseIncomePerSec * getMutationMultiplier(slot.mutation) > minIncome;
    });
  });
}

function isPlayerAtHome(): boolean {
  const world = useWorldStore.getState();
  const px = Math.floor((world.playerX + 12) / TILE_SIZE);
  const py = Math.floor((world.playerY + 12) / TILE_SIZE);
  return px >= HOME_BOUNDS.minCol && px <= HOME_BOUNDS.maxCol &&
         py >= HOME_BOUNDS.minRow && py <= HOME_BOUNDS.maxRow;
}

function isPlayerValidStealTarget(npc: NPCState): boolean {
  const game = useGameStore.getState();
  if (game.shield.active) return false;
  if (isPlayerAtHome()) return false;

  const minIncome = getThiefMinIncomeThreshold(npc);
  const ownedMap = new Map(game.ownedBrainrots.map(b => [b.instanceId, b]));
  return game.buildingSlots.some(instanceId => {
    if (!instanceId) return false;
    const owned = ownedMap.get(instanceId);
    if (!owned) return false;
    const def = BRAINROT_MAP.get(owned.defId);
    if (!def) return false;
    if (RARITY_ORDER.indexOf(def.rarity) < STEAL_MIN_RARITY_IDX) return false;
    return def.baseIncomePerSec * getMutationMultiplier(owned.mutation) > minIncome;
  });
}

function tickNPCSteal(npc: NPCState, dt: number): NPCState {
  if (npc.waypointIndex < npc.waypoints.length) {
    if (npc.npcStealTarget && isNPCHome(npc.npcStealTarget)) {
      return buildGoHomeState(npc, { npcStealTarget: null });
    }
    return tickMoving(npc, dt, 'npc_steal');
  }

  const world = useWorldStore.getState();
  const targetNPC = npc.npcStealTarget
    ? world.npcs.find(n => n.id === npc.npcStealTarget)
    : null;

  if (!targetNPC) {
    return buildGoHomeState(npc, { npcStealTarget: null });
  }

  if (isNPCHome(targetNPC.id)) {
    return buildGoHomeState(npc, { npcStealTarget: null });
  }

  const minIncome = getThiefMinIncomeThreshold(npc);
  let bestSlotIdx = -1;
  let bestIncome = 0;
  for (let i = 0; i < targetNPC.buildingSlots.length; i++) {
    const slot = targetNPC.buildingSlots[i];
    if (!slot) continue;
    if (_pendingNPCSteals.some(s => s.targetId === targetNPC.id && s.slotIdx === i)) continue;
    const def = BRAINROT_MAP.get(slot.defId);
    if (!def) continue;
    if (RARITY_ORDER.indexOf(def.rarity) < STEAL_MIN_RARITY_IDX) continue;
    const effectiveIncome = def.baseIncomePerSec * getMutationMultiplier(slot.mutation);
    if (effectiveIncome <= minIncome) continue;
    const stealChance = 1 / def.stealDifficulty;
    if (Math.random() > stealChance) continue;
    if (effectiveIncome > bestIncome) {
      bestIncome = effectiveIncome;
      bestSlotIdx = i;
    }
  }

  if (bestSlotIdx === -1) {
    return buildGoHomeState(npc, { npcStealTarget: null });
  }

  const stolenSlot = targetNPC.buildingSlots[bestSlotIdx]!;
  _pendingNPCSteals.push({ targetId: targetNPC.id, slotIdx: bestSlotIdx, defId: stolenSlot.defId, mutation: stolenSlot.mutation });
  _pendingChases.push({ victimId: targetNPC.id, thiefId: npc.id, stolenSlotIdx: bestSlotIdx, stolenDefId: stolenSlot.defId, stolenMutation: stolenSlot.mutation });

  return buildGoHomeState(npc, { carryingDefId: stolenSlot.defId, carryingMutation: stolenSlot.mutation, npcStealTarget: null });
}

function goHomeAndClearChase(npc: NPCState): NPCState {
  return buildGoHomeState(npc, { pendingChase: null });
}

function moveToward(
  npc: NPCState, dx: number, dy: number, dist: number, dt: number,
): NPCState {
  if (dist < 0.1) return npc;
  const base = NPC_BASE_MAP.get(npc.baseId)!;
  const step = base.moveSpeed * dt;
  const ratio = Math.min(step / dist, 1);

  let newX = npc.x + dx * ratio;
  let newY = npc.y + dy * ratio;

  if (!isWalkableRect(TOWN_MAP, TILE_DEFS, newX, newY, NPC_SIZE, NPC_SIZE)) {
    if (isWalkableRect(TOWN_MAP, TILE_DEFS, newX, npc.y, NPC_SIZE, NPC_SIZE)) {
      newY = npc.y;
    } else if (isWalkableRect(TOWN_MAP, TILE_DEFS, npc.x, newY, NPC_SIZE, NPC_SIZE)) {
      newX = npc.x;
    } else {
      newX = npc.x;
      newY = npc.y;
    }
  }

  let dir: Direction = npc.direction;
  if (Math.abs(dx) > Math.abs(dy)) {
    dir = dx > 0 ? 'right' : 'left';
  } else if (Math.abs(dy) > 0) {
    dir = dy > 0 ? 'down' : 'up';
  }

  return { ...npc, x: newX, y: newY, direction: dir };
}

function restoreSlotAndGoHome(npc: NPCState): NPCState {
  const slotIdx = npc.pendingChase!.stolenSlotIdx;
  const defId = npc.pendingChase!.stolenDefId;
  const mutation = npc.pendingChase!.stolenMutation;

  if (slotIdx === -1) {
    return buildGoHomeState(npc, { carryingDefId: defId, carryingMutation: mutation, pendingChase: null });
  }

  const slots = [...npc.buildingSlots];
  insertItemIntoSlot(slots, slotIdx, { defId, mutation });
  return buildGoHomeState(npc, {
    buildingSlots: slots,
    incomePerSec: calcSlotsIncome(slots),
    pendingChase: null,
  });
}

function tickChasingThief(npc: NPCState, dt: number): NPCState {
  if (!npc.pendingChase) return goHomeAndClearChase(npc);

  if (npc.carryingDefId) {
    return buildGoHomeState(npc);
  }

  const chasingPlayer = npc.pendingChase.thiefId === 'player';

  if (chasingPlayer) {
    const world = useWorldStore.getState();
    const playerCarrying = world.carryingBrainrot;

    const chaseId = npc.pendingChase.stolenInstanceId;
    if (!playerCarrying
      || playerCarrying.defId !== npc.pendingChase.stolenDefId
      || playerCarrying.mutation !== npc.pendingChase.stolenMutation
      || (chaseId && playerCarrying.instanceId && playerCarrying.instanceId !== chaseId)) {
      return goHomeAndClearChase(npc);
    }

    const dx = (world.playerX + 12) - (npc.x + NPC_SIZE / 2);
    const dy = (world.playerY + 12) - (npc.y + NPC_SIZE / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (npc.stateTimer > 0.5 && dist < TILE_SIZE * 1.2) {
      _pendingPlayerCatches.push({
        stolenDefId: npc.pendingChase.stolenDefId,
        stolenSlotIdx: npc.pendingChase.stolenSlotIdx,
        stolenMutation: npc.pendingChase.stolenMutation,
        stolenInstanceId: npc.pendingChase.stolenInstanceId,
      });
      return restoreSlotAndGoHome(npc);
    }

    return moveToward(npc, dx, dy, dist, dt);
  }

  const world = useWorldStore.getState();
  const thief = world.npcs.find(n => n.id === npc.pendingChase!.thiefId);

  if (!thief || !thief.carryingDefId) return goHomeAndClearChase(npc);

  const dx = (thief.x + NPC_SIZE / 2) - (npc.x + NPC_SIZE / 2);
  const dy = (thief.y + NPC_SIZE / 2) - (npc.y + NPC_SIZE / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < TILE_SIZE * 1.2) {
    _pendingCatches.push({
      thiefId: thief.id,
      victimId: npc.id,
      stolenDefId: npc.pendingChase!.stolenDefId,
      stolenSlotIdx: npc.pendingChase!.stolenSlotIdx,
      stolenMutation: npc.pendingChase!.stolenMutation,
    });
    return goHomeAndClearChase(npc);
  }

  return moveToward(npc, dx, dy, dist, dt);
}

function tickStealAttempt(npc: NPCState, dt: number): NPCState {
  if (npc.waypointIndex >= npc.waypoints.length) {
    const game = useGameStore.getState();

    if (game.shield.active) {
      return buildGoHomeState(npc);
    }

    const minIncome = getThiefMinIncomeThreshold(npc);
    const ownedMap = new Map(game.ownedBrainrots.map(b => [b.instanceId, b]));
    const stealCandidates = game.buildingSlots
      .map((id, idx) => ({ id, idx }))
      .filter(s => {
        if (!s.id) return false;
        const o = ownedMap.get(s.id);
        if (!o) return false;
        const d = BRAINROT_MAP.get(o.defId);
        if (!d) return false;
        if (RARITY_ORDER.indexOf(d.rarity) < STEAL_MIN_RARITY_IDX) return false;
        if (d.baseIncomePerSec * getMutationMultiplier(o.mutation) <= minIncome) return false;
        return Math.random() < 1 / d.stealDifficulty;
      });

    if (stealCandidates.length > 0) {
      const victim = stealCandidates[Math.floor(Math.random() * stealCandidates.length)];
      const owned = ownedMap.get(victim.id!);
      if (owned) {
        _npcStolenFromPlayer.set(npc.id, { slotIdx: victim.idx, defId: owned.defId, mutation: owned.mutation, instanceId: owned.instanceId });
        game.removeBrainrot(victim.id!);
        game.recalcIncome();
        return buildGoHomeState(npc, { carryingDefId: owned.defId, carryingMutation: owned.mutation });
      }
    }

    return buildGoHomeState(npc);
  }

  return tickMoving(npc, dt, npc.state);
}

function deliverToSlot(npc: NPCState): NPCState {
  _npcStolenFromPlayer.delete(npc.id);
  if (!npc.carryingDefId) {
    if (npc.pendingChase) {
      return { ...npc, state: 'chasing_thief', stateTimer: 0, waypoints: [], waypointIndex: 0 };
    }
    return { ...npc, state: 'idle', stateTimer: 0, pauseTimer: 0 };
  }

  const slots = [...npc.buildingSlots];
  const emptyIdx = slots.indexOf(null);
  const newSlotItem: NPCSlotItem = { defId: npc.carryingDefId, mutation: npc.carryingMutation };

  if (emptyIdx !== -1) {
    slots[emptyIdx] = newSlotItem;
  } else {
    const newDef = BRAINROT_MAP.get(npc.carryingDefId);
    const newIncome = newDef ? newDef.baseIncomePerSec * getMutationMultiplier(npc.carryingMutation) : 0;
    let worstIdx = -1;
    let worstIncome = Infinity;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s) continue;
      const def = BRAINROT_MAP.get(s.defId);
      const inc = def ? def.baseIncomePerSec * getMutationMultiplier(s.mutation) : 0;
      if (inc < worstIncome) { worstIncome = inc; worstIdx = i; }
    }
    if (worstIdx !== -1 && newIncome > worstIncome) {
      slots[worstIdx] = newSlotItem;
    }
  }

  const nextState: NPCBehaviorState = npc.pendingChase ? 'chasing_thief' : 'idle';

  return {
    ...npc,
    carryingDefId: null,
    carryingMutation: undefined,
    buildingSlots: slots,
    incomePerSec: calcSlotsIncome(slots),
    state: nextState,
    stateTimer: 0,
    pauseTimer: 0,
    waypoints: [],
    waypointIndex: 0,
  };
}

// --- Waypoint generation ---

function tc(col: number, row: number): { x: number; y: number } {
  return { x: col * TILE_SIZE + TILE_SIZE / 2 - NPC_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 - NPC_SIZE / 2 };
}

// A* shortest-path on the tile grid (8-directional movement, respects walkability)
const SQRT2 = Math.SQRT2;
const isTileWalkable = (c: number, r: number, mapW: number, mapH: number) => {
  if (c < 0 || c >= mapW || r < 0 || r >= mapH) return false;
  const td = TILE_DEFS[TOWN_MAP[r][c]];
  return td ? td.walkable : false;
};

function findTilePath(
  fromCol: number, fromRow: number,
  toCol: number, toRow: number,
): { col: number; row: number }[] {
  const mapH = TOWN_MAP.length;
  const mapW = TOWN_MAP[0].length;
  const fc = Math.max(0, Math.min(mapW - 1, fromCol));
  const fr = Math.max(0, Math.min(mapH - 1, fromRow));
  const gc = Math.max(0, Math.min(mapW - 1, toCol));
  const gr = Math.max(0, Math.min(mapH - 1, toRow));

  if (fc === gc && fr === gr) return [];

  const key = (c: number, r: number) => r * mapW + c;
  const startKey = key(fc, fr);
  const goalKey = key(gc, gr);

  // Octile distance heuristic (accounts for diagonal moves costing √2)
  const h = (c: number, r: number) => {
    const dx = Math.abs(c - gc);
    const dy = Math.abs(r - gr);
    return (dx + dy) + (SQRT2 - 2) * Math.min(dx, dy);
  };

  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const closed = new Set<number>();
  const open: number[] = [startKey];

  gScore.set(startKey, 0);
  fScore.set(startKey, h(fc, fr));

  const dirs = [
    { dc: 0, dr: -1 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
    { dc: -1, dr: -1 }, { dc: 1, dr: -1 }, { dc: -1, dr: 1 }, { dc: 1, dr: 1 },
  ];

  while (open.length > 0) {
    let bestIdx = 0;
    let bestF = fScore.get(open[0]) ?? Infinity;
    for (let i = 1; i < open.length; i++) {
      const f = fScore.get(open[i]) ?? Infinity;
      if (f < bestF) { bestF = f; bestIdx = i; }
    }

    const current = open[bestIdx];
    open.splice(bestIdx, 1);

    if (closed.has(current)) continue;
    if (current === goalKey) {
      const path: { col: number; row: number }[] = [];
      let node = current;
      while (cameFrom.has(node)) {
        path.unshift({ col: node % mapW, row: Math.floor(node / mapW) });
        node = cameFrom.get(node)!;
      }
      return path;
    }
    closed.add(current);

    const curCol = current % mapW;
    const curRow = Math.floor(current / mapW);

    for (const { dc, dr } of dirs) {
      const nc = curCol + dc;
      const nr = curRow + dr;
      if (nc < 0 || nc >= mapW || nr < 0 || nr >= mapH) continue;
      const nk = key(nc, nr);
      if (closed.has(nk)) continue;

      if (!isTileWalkable(nc, nr, mapW, mapH)) continue;

      const diagonal = dc !== 0 && dr !== 0;
      if (diagonal) {
        // Prevent corner-cutting: both adjacent cardinal tiles must be walkable
        if (!isTileWalkable(curCol + dc, curRow, mapW, mapH)) continue;
        if (!isTileWalkable(curCol, curRow + dr, mapW, mapH)) continue;
      }

      const cost = diagonal ? SQRT2 : 1;
      const tentativeG = (gScore.get(current) ?? Infinity) + cost;
      if (tentativeG >= (gScore.get(nk) ?? Infinity)) continue;

      cameFrom.set(nk, current);
      gScore.set(nk, tentativeG);
      fScore.set(nk, tentativeG + h(nc, nr));
      open.push(nk);
    }
  }

  return [];
}

function simplifyTilePath(path: { col: number; row: number }[]): { col: number; row: number }[] {
  if (path.length <= 2) return path;
  const result = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];
    if (curr.col - prev.col !== next.col - curr.col || curr.row - prev.row !== next.row - curr.row) {
      result.push(curr);
    }
  }
  result.push(path[path.length - 1]);
  return result;
}

function buildAStarWaypoints(
  fromX: number, fromY: number,
  toCol: number, toRow: number,
): { x: number; y: number }[] {
  const fromCol = Math.floor((fromX + NPC_SIZE / 2) / TILE_SIZE);
  const fromRow = Math.floor((fromY + NPC_SIZE / 2) / TILE_SIZE);
  const tilePath = findTilePath(fromCol, fromRow, toCol, toRow);
  if (tilePath.length === 0) return [tc(toCol, toRow)];
  return simplifyTilePath(tilePath).map(p => tc(p.col, p.row));
}

function buildSafeReturnToBase(
  base: NPCBaseDef,
  fromX: number,
  fromY: number,
): { x: number; y: number }[] {
  return buildAStarWaypoints(fromX, fromY, base.pathCol, base.entranceRow);
}

function buildConveyorWaypoints(npcX: number, npcY: number): { x: number; y: number }[] {
  const waitCol = Math.floor(20 + Math.random() * 25);
  return buildAStarWaypoints(npcX, npcY, waitCol, CONVEYOR_ROW);
}

function buildNPCToNPCWaypoints(npcX: number, npcY: number, targetBase: NPCBaseDef): { x: number; y: number }[] {
  const targetIsUpper = targetBase.entranceRow < CONVEYOR_ROW;
  const interiorRow = targetIsUpper
    ? targetBase.buildingBounds.minRow + 1
    : targetBase.buildingBounds.maxRow - 1;
  return buildAStarWaypoints(npcX, npcY, targetBase.pathCol, interiorRow);
}

const PLAYER_HOME_COL = 24;
const PLAYER_HOME_ENTRANCE_ROW = 6;

function buildStealWaypoints(npcX: number, npcY: number): { x: number; y: number }[] {
  return buildAStarWaypoints(npcX, npcY, PLAYER_HOME_COL, PLAYER_HOME_ENTRANCE_ROW - 1);
}

// --- Public helpers ---

export function isNPCHome(npcId: string): boolean {
  const npc = useWorldStore.getState().npcs.find(n => n.id === npcId);
  if (!npc) return false;

  const base = NPC_BASE_MAP.get(npc.baseId);
  if (!base) return false;

  const b = base.buildingBounds;
  const tx = Math.floor((npc.x + NPC_SIZE / 2) / TILE_SIZE);
  const ty = Math.floor((npc.y + NPC_SIZE / 2) / TILE_SIZE);

  return tx >= b.minCol && tx <= b.maxCol && ty >= b.minRow && ty <= b.maxRow;
}

export function findCarryingNPCNearPlayer(): NPCState | null {
  const world = useWorldStore.getState();
  const px = world.playerX + NPC_SIZE / 2;
  const py = world.playerY + NPC_SIZE / 2;

  for (const npc of world.npcs) {
    if (!npc.carryingDefId) continue;
    const dist = Math.sqrt((px - npc.x - NPC_SIZE / 2) ** 2 + (py - npc.y - NPC_SIZE / 2) ** 2);
    if (dist < TILE_SIZE * 1.5) return npc;
  }

  return null;
}

export function stealFromCarryingNPC(npcId: string): { defId: string; mutation?: Mutation } | null {
  const world = useWorldStore.getState();
  const npc = world.npcs.find(n => n.id === npcId);
  if (!npc || !npc.carryingDefId) return null;
  _npcStolenFromPlayer.delete(npcId);

  const defId = npc.carryingDefId;
  const mutation = npc.carryingMutation;

  world.updateNPC(npcId, {
    carryingDefId: null,
    carryingMutation: undefined,
    state: 'chasing_thief',
    stateTimer: 0,
    pendingChase: { thiefId: 'player', stolenSlotIdx: -1, stolenDefId: defId, stolenMutation: mutation },
    waypoints: [],
    waypointIndex: 0,
  });

  return { defId, mutation };
}

export function stealFromNPCSlot(npcId: string, slotIndex: number): { defId: string; mutation?: Mutation } | null {
  const world = useWorldStore.getState();
  const npc = world.npcs.find(n => n.id === npcId);
  if (!npc) return null;

  const slot = npc.buildingSlots[slotIndex];
  if (!slot) return null;

  const defId = slot.defId;
  const mutation = slot.mutation;
  const slots = [...npc.buildingSlots];
  slots[slotIndex] = null;
  const income = calcSlotsIncome(slots);
  const chaseInfo = { thiefId: 'player', stolenSlotIdx: slotIndex, stolenDefId: defId, stolenMutation: mutation };

  if (npc.carryingDefId) {
    const base = NPC_BASE_MAP.get(npc.baseId)!;
    world.updateNPC(npcId, {
      buildingSlots: slots,
      incomePerSec: income,
      state: 'carrying_home' as NPCBehaviorState,
      stateTimer: 0,
      pendingChase: chaseInfo,
      waypoints: buildSafeReturnToBase(base, npc.x, npc.y),
      waypointIndex: 0,
    });
  } else {
    world.updateNPC(npcId, {
      buildingSlots: slots,
      incomePerSec: income,
      state: 'chasing_thief' as NPCBehaviorState,
      stateTimer: 0,
      pendingChase: chaseInfo,
      waypoints: [],
      waypointIndex: 0,
    });
  }

  return { defId, mutation };
}

export function recoverFromNPC(npcId: string): boolean {
  const stolen = _npcStolenFromPlayer.get(npcId);
  if (!stolen) return false;

  const world = useWorldStore.getState();
  const npc = world.npcs.find(n => n.id === npcId);
  if (!npc || npc.carryingDefId !== stolen.defId || npc.carryingMutation !== stolen.mutation) {
    _npcStolenFromPlayer.delete(npcId);
    return false;
  }

  const def = BRAINROT_MAP.get(stolen.defId);
  if (!def) return false;

  const game = useGameStore.getState();

  if (!game.hasEmptySlot()) {
    return false;
  }

  const newOwned = {
    defId: def.id,
    instanceId: `${def.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    acquiredAt: Date.now(),
    source: 'steal' as const,
    mutation: stolen.mutation,
  };

  game.addBrainrot(newOwned);

  const currentSlots = useGameStore.getState().buildingSlots;
  if (currentSlots[stolen.slotIdx] !== newOwned.instanceId && !currentSlots[stolen.slotIdx]) {
    game.assignSlot(stolen.slotIdx, newOwned.instanceId);
  }

  game.discoverBrainrot(def.id);
  game.recalcIncome();

  const pos = buildNPCHomePos(npc);
  world.updateNPC(npcId, {
    carryingDefId: null,
    carryingMutation: undefined,
    x: pos.x,
    y: pos.y,
    state: 'idle' as NPCBehaviorState,
    stateTimer: 0,
    pauseTimer: 0,
    waypoints: [],
    waypointIndex: 0,
  });

  _npcStolenFromPlayer.delete(npcId);
  return true;
}

export function clearStolenFromPlayerMap() {
  _npcStolenFromPlayer.clear();
}

export function tickNPCIncome() {
  if (useGearStore.getState().hasActiveEffect('npc_stun')) return;

  const world = useWorldStore.getState();
  if (!Array.isArray(world.npcs)) return;
  const npcs = world.npcs.map(npc => ({
    ...npc,
    currency: npc.currency + npc.incomePerSec,
  }));
  world.setNPCs(npcs);
}
