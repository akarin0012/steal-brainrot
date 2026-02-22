import type { ConveyorItem, BrainrotDef, Rarity, Mutation } from '../types/game.ts';
import { ALL_BRAINROTS, BRAINROT_MAP } from '../data/brainrots.ts';
import { RARITIES } from '../data/rarities.ts';
import { TILE_SIZE } from '../utils/collision.ts';
import { CONVEYOR_ROW, CONVEYOR_START_COL, CONVEYOR_END_COL } from '../data/townMap.ts';
import { useGameStore } from '../stores/gameStore.ts';
import { weightedRandom } from '../utils/rng.ts';
import { rollMutation, MUTATIONS } from '../data/mutations.ts';

const BELT_SPEED = 28;
const SPAWN_INTERVAL_BASE = 2.8;
const BELT_LEFT = CONVEYOR_START_COL * TILE_SIZE;
const BELT_RIGHT = (CONVEYOR_END_COL + 1) * TILE_SIZE;
const BELT_Y = CONVEYOR_ROW * TILE_SIZE;

const RARITY_COST: Record<Rarity, number> = {
  common: 10,
  uncommon: 150,
  rare: 2_000,
  epic: 25_000,
  legendary: 300_000,
  mythic: 5_000_000,
  god: 100_000_000,
  secret: 50_000_000,
};

let items: ConveyorItem[] = [];
let spawnTimer = 0;
let nextId = 0;
let animOffset = 0;

function spawnItem() {
  const store = useGameStore.getState();
  const unlocked = store.getUnlockedRarities();
  const weights = unlocked.map(r => RARITIES[r].dropRate);
  const rarity = weightedRandom(unlocked, weights);
  const pool = ALL_BRAINROTS.filter(b => b.rarity === rarity);
  if (pool.length === 0) return;
  const def = pool[Math.floor(Math.random() * pool.length)];

  const mutation = rollMutation();
  let cost = RARITY_COST[rarity] ?? 10;
  if (mutation) cost = Math.floor(cost * MUTATIONS[mutation].multiplier);

  items.push({
    id: `conv_${nextId++}`,
    defId: def.id,
    x: BELT_RIGHT - TILE_SIZE * 0.5,
    cost,
    mutation,
  });
}

export function tickConveyor(dt: number) {
  animOffset = (animOffset + BELT_SPEED * dt) % TILE_SIZE;

  spawnTimer += dt;
  const interval = SPAWN_INTERVAL_BASE + (Math.random() - 0.5) * 0.4;
  if (spawnTimer >= interval) {
    spawnTimer = 0;
    spawnItem();
  }

  for (const item of items) {
    item.x -= BELT_SPEED * dt;
  }

  items = items.filter(item => item.x > BELT_LEFT - TILE_SIZE * 0.5);
}

export function getConveyorItems(): readonly ConveyorItem[] {
  return items;
}

export function getConveyorAnimOffset(): number {
  return animOffset;
}

export function findNearestConveyorItem(playerX: number, playerY: number): ConveyorItem | null {
  const playerCX = playerX + 12;
  const playerCY = playerY + 12;
  const beltCY = BELT_Y + TILE_SIZE * 0.5;

  if (Math.abs(playerCY - beltCY) > TILE_SIZE * 1.8) return null;
  if (playerCX < BELT_LEFT - TILE_SIZE || playerCX > BELT_RIGHT + TILE_SIZE) return null;

  let closest: ConveyorItem | null = null;
  let closestDist = TILE_SIZE * 1.5;

  for (const item of items) {
    const dist = Math.abs(playerCX - item.x);
    if (dist < closestDist) {
      closestDist = dist;
      closest = item;
    }
  }

  return closest;
}

export function pickUpConveyorItem(itemId: string): { def: BrainrotDef; mutation?: Mutation } | null {
  const idx = items.findIndex(i => i.id === itemId);
  if (idx === -1) return null;

  const item = items[idx];
  const store = useGameStore.getState();

  if (!store.spendCurrency(item.cost)) return null;

  const def = BRAINROT_MAP.get(item.defId);
  if (!def) return null;

  items.splice(idx, 1);
  return { def, mutation: item.mutation };
}

export function removeConveyorItem(itemId: string): { def: BrainrotDef; mutation?: Mutation } | null {
  const idx = items.findIndex(i => i.id === itemId);
  if (idx === -1) return null;

  const item = items[idx];
  const def = BRAINROT_MAP.get(item.defId);
  if (!def) return null;

  items.splice(idx, 1);
  return { def, mutation: item.mutation };
}

export function getConveyorBounds() {
  return { left: BELT_LEFT, right: BELT_RIGHT, y: BELT_Y, row: CONVEYOR_ROW };
}
