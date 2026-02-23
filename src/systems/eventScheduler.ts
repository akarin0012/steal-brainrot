import type { Rarity } from '../types/game.ts';
import { useGameStore } from '../stores/gameStore.ts';
import { forceSpawnRarity, setOnSpawnCallback } from './conveyor.ts';

export interface GameEvent {
  id: string;
  type: string;
  intervalSec: number;
  elapsedSec: number;
  enabled: () => boolean;
  execute: () => void;
}

const PITY_CONFIG: { rarity: Rarity; intervalSec: number }[] = [
  { rarity: 'rare',      intervalSec: 120 },
  { rarity: 'epic',      intervalSec: 300 },
  { rarity: 'legendary', intervalSec: 300 },
  { rarity: 'mythic',    intervalSec: 900 },
];

const events: GameEvent[] = [];

function initPityTimers() {
  for (const cfg of PITY_CONFIG) {
    events.push({
      id: `pity_${cfg.rarity}`,
      type: 'pity',
      intervalSec: cfg.intervalSec,
      elapsedSec: 0,
      enabled: () => {
        const unlocked = useGameStore.getState().getUnlockedRarities();
        return unlocked.includes(cfg.rarity);
      },
      execute: () => {
        forceSpawnRarity(cfg.rarity);
      },
    });
  }

  setOnSpawnCallback(onBrainrotSpawned);
}

initPityTimers();

export function tickEvents(dt: number) {
  for (const ev of events) {
    if (!ev.enabled()) continue;
    ev.elapsedSec += dt;
    if (ev.elapsedSec >= ev.intervalSec) {
      ev.elapsedSec = 0;
      ev.execute();
    }
  }
}

export function onBrainrotSpawned(rarity: Rarity) {
  const ev = events.find(e => e.type === 'pity' && e.id === `pity_${rarity}`);
  if (ev) ev.elapsedSec = 0;
}

export function getPityTimers(): { rarity: Rarity; elapsedSec: number; intervalSec: number }[] {
  return PITY_CONFIG.map(cfg => {
    const ev = events.find(e => e.id === `pity_${cfg.rarity}`);
    return {
      rarity: cfg.rarity,
      elapsedSec: ev?.elapsedSec ?? 0,
      intervalSec: cfg.intervalSec,
    };
  });
}

export function resetAllEvents() {
  for (const ev of events) {
    ev.elapsedSec = 0;
  }
}

export function registerEvent(event: GameEvent) {
  events.push(event);
}
