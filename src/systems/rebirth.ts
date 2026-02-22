import { useGameStore } from '../stores/gameStore.ts';
import { useWorldStore } from '../stores/worldStore.ts';
import { useGearStore } from '../stores/gearStore.ts';
import { clearStolenFromPlayerMap } from './npcAI.ts';

export function performRebirth(): boolean {
  const store = useGameStore.getState();
  if (!store.canRebirth()) return false;
  clearStolenFromPlayerMap();
  store.performRebirth();
  useWorldStore.getState().resetWorld();
  useGearStore.getState().resetGears();
  return true;
}

export function getNextRebirthInfo(): { level: number; cost: number; multiplier: number } | null {
  const store = useGameStore.getState();
  const nextLevel = store.rebirthLevel + 1;
  const cost = store.getRebirthRequirement();
  if (cost === Infinity) return null;

  const multiplierTable: Record<number, number> = {
    1: 1.5, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6.5, 7: 8, 8: 10,
    9: 12, 10: 15, 11: 18, 12: 22, 13: 26, 14: 30, 15: 35,
    16: 40, 17: 45, 18: 48, 19: 52, 20: 55,
  };
  return { level: nextLevel, cost, multiplier: multiplierTable[nextLevel] ?? 55 };
}
