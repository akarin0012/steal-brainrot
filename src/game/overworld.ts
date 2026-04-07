import { useWorldStore } from '../stores/worldStore.ts';
import { useUIStore } from '../stores/uiStore.ts';
import { useGameStore } from '../stores/gameStore.ts';
import { useGearStore } from '../stores/gearStore.ts';
import { input } from '../engine/input.ts';
import { PLAYER_SIZE, MAP_W, MAP_H } from '../engine/renderer.ts';
import { TILE_SIZE, isWalkableRect } from '../utils/collision.ts';
import { TOWN_MAP, TILE_DEFS, HOME_BOUNDS } from '../data/townMap.ts';
import { BRAINROT_MAP } from '../data/brainrots.ts';
import {
  findNearbyInteractable,
  findNearbyCarryingNPC,
} from '../systems/interact.ts';
import { formatNumber } from '../utils/bigNumber.ts';
import { isNPCHome, isPointInShieldedBuilding, isNPCShieldActiveForBase } from '../systems/npcAI.ts';
import type { Direction } from '../types/game.ts';
import { getMutationMultiplier } from '../data/mutations.ts';
import { createOwnedBrainrot } from '../utils/uid.ts';
import { isSlotReplaceSuppressed, clearSlotReplaceSuppress } from '../systems/slotGuard.ts';
import { findNearestConveyorItem } from '../systems/conveyor.ts';
import { useOnlineStore } from '../stores/onlineStore.ts';

const CANVAS_W = MAP_W * TILE_SIZE;
const CANVAS_H = MAP_H * TILE_SIZE;
const PLAYER_SPEED = 120;
const BASE_CARRY_SPEED_MULT = 0.65;

function getInteractLabel(target: { type: string; label: string; data?: Record<string, unknown> }): string {
  if (target.type === 'shield_device') {
    const store = useGameStore.getState();
    if (store.shield.active) {
      return `Shield Active (${Math.ceil(store.shield.remainingSec)}s)`;
    }
    const cost = store.getShieldCost();
    return cost > 0 ? `Activate Shield ($${formatNumber(cost)})` : 'Activate Shield';
  }
  if (target.type === 'npc_building_slot') {
    const baseId = target.data?.baseId as string;
    if (isNPCShieldActiveForBase(baseId)) {
      return 'Shield Active!';
    }
    const npcId = `npc_${baseId}`;
    if (isNPCHome(npcId)) {
      return 'NPC is guarding!';
    }
    return 'Steal Brainrot';
  }
  if (target.type === 'fusion_machine') {
    return 'Fusion Machine';
  }
  return target.label;
}

function resolvePrompt(world: ReturnType<typeof useWorldStore.getState>): { label: string; id: string } | null {
  if (!world.carryingBrainrot) {
    const nearNPC = findNearbyCarryingNPC();
    if (nearNPC) return { label: 'Steal from NPC!', id: nearNPC.npcId };

    const convItem = findNearestConveyorItem(world.playerX, world.playerY);
    if (convItem) return { label: `Pick up ($${formatNumber(convItem.cost)})`, id: convItem.id };

    const nearPlayer = useOnlineStore.getState().remotePlayers.find((p) => {
      const dx = p.x - world.playerX;
      const dy = p.y - world.playerY;
      return Math.sqrt(dx * dx + dy * dy) < TILE_SIZE * 1.8;
    });
    if (nearPlayer) {
      const stealHint = Math.max(25, Math.floor(nearPlayer.currency * 0.05));
      return { label: `Steal Player ($${formatNumber(stealHint)})`, id: `remote_${nearPlayer.id}` };
    }
  }

  const target = findNearbyInteractable();
  if (target) return { label: getInteractLabel(target), id: target.id };
  return null;
}

function updateInteractPrompt(): void {
  const world = useWorldStore.getState();
  const ui = useUIStore.getState();

  const prompt = resolvePrompt(world);
  if (prompt) {
    if (ui.interactObjectId !== prompt.id || ui.interactPrompt !== prompt.label) {
      ui.setInteractPrompt(prompt.label, prompt.id);
    }
  } else if (ui.interactPrompt !== null) {
    ui.setInteractPrompt(null, null);
  }
}

function checkHomeDelivery(): void {
  const world = useWorldStore.getState();
  const carrying = world.carryingBrainrot;
  if (!carrying) return;
  if (useUIStore.getState().overlay !== 'none') return;

  const tileX = Math.floor((world.playerX + PLAYER_SIZE / 2) / TILE_SIZE);
  const tileY = Math.floor((world.playerY + PLAYER_SIZE / 2) / TILE_SIZE);

  const inHome = tileX >= HOME_BOUNDS.minCol && tileX <= HOME_BOUNDS.maxCol &&
    tileY >= HOME_BOUNDS.minRow && tileY <= HOME_BOUNDS.maxRow;

  if (!inHome) {
    clearSlotReplaceSuppress();
    return;
  }

  const def = BRAINROT_MAP.get(carrying.defId);
  if (!def) {
    world.setCarrying(null);
    return;
  }

  const store = useGameStore.getState();

  const mutation = carrying.mutation;
  const source = carrying.source ?? 'conveyor';
  const mutMult = getMutationMultiplier(mutation);

  if (store.hasEmptySlot()) {
    clearSlotReplaceSuppress();
    store.addBrainrot(createOwnedBrainrot(def.id, source, mutation));
    store.discoverBrainrot(def.id);
    store.recalcIncome();
    world.setCarrying(null);
    return;
  }

  const newEffectiveIncome = def.baseIncomePerSec * mutMult;
  let worstIdx = -1;
  let worstIncome = Infinity;
  for (let i = 0; i < store.buildingSlots.length; i++) {
    const instId = store.buildingSlots[i];
    if (!instId) continue;
    const o = store.ownedBrainrots.find(b => b.instanceId === instId);
    if (!o) continue;
    const d = BRAINROT_MAP.get(o.defId);
    if (!d) continue;
    const slotIncome = d.baseIncomePerSec * getMutationMultiplier(o.mutation);
    if (slotIncome < worstIncome) {
      worstIncome = slotIncome;
      worstIdx = i;
    }
  }

  if (newEffectiveIncome > worstIncome && worstIdx !== -1) {
    clearSlotReplaceSuppress();
    store.clearSlot(worstIdx);
    store.addBrainrot(createOwnedBrainrot(def.id, source, mutation));
    store.discoverBrainrot(def.id);
    store.recalcIncome();
    world.setCarrying(null);
  } else {
    if (isSlotReplaceSuppressed(def.id, mutation)) {
      return;
    }
    useUIStore.getState().openOverlay('slot_replace', { defId: def.id, mutation });
  }
}

export function updateOverworld(dt: number): void {
  const { dx, dy } = input.getMovement();
  if (dx === 0 && dy === 0) {
    checkHomeDelivery();
    updateInteractPrompt();
    return;
  }

  const world = useWorldStore.getState();
  let dir: Direction = world.playerDir;
  if (dy < 0) dir = 'up';
  else if (dy > 0) dir = 'down';
  else if (dx < 0) dir = 'left';
  else if (dx > 0) dir = 'right';

  const gearSpeedBoost = useGearStore.getState().getEffectValue('speed_boost');
  const carryMult = BASE_CARRY_SPEED_MULT;
  const baseSpeed = world.carryingBrainrot ? PLAYER_SPEED * carryMult : PLAYER_SPEED;
  const speed = baseSpeed * (1 + gearSpeedBoost) * dt;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ndx = (dx / len) * speed;
  const ndy = (dy / len) * speed;

  let newX = world.playerX + ndx;
  let newY = world.playerY + ndy;

  if (!isWalkableRect(TOWN_MAP, TILE_DEFS, newX, newY, PLAYER_SIZE, PLAYER_SIZE)) {
    if (isWalkableRect(TOWN_MAP, TILE_DEFS, newX, world.playerY, PLAYER_SIZE, PLAYER_SIZE)) {
      newY = world.playerY;
    } else if (isWalkableRect(TOWN_MAP, TILE_DEFS, world.playerX, newY, PLAYER_SIZE, PLAYER_SIZE)) {
      newX = world.playerX;
    } else {
      newX = world.playerX;
      newY = world.playerY;
    }
  }

  if (isPointInShieldedBuilding(newX, newY)) {
    if (!isPointInShieldedBuilding(newX, world.playerY)) {
      newY = world.playerY;
    } else if (!isPointInShieldedBuilding(world.playerX, newY)) {
      newX = world.playerX;
    } else {
      newX = world.playerX;
      newY = world.playerY;
    }
  }

  newX = Math.max(0, Math.min(CANVAS_W - PLAYER_SIZE, newX));
  newY = Math.max(0, Math.min(CANVAS_H - PLAYER_SIZE, newY));

  useWorldStore.getState().setPlayerPos(newX, newY);
  useWorldStore.getState().setPlayerDir(dir);

  checkHomeDelivery();
  updateInteractPrompt();
}
