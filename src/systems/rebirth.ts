import { useGameStore, REBIRTH_TABLE } from '../stores/gameStore.ts';
import { useWorldStore } from '../stores/worldStore.ts';
import { useGearStore } from '../stores/gearStore.ts';
import { useOnlineStore } from '../stores/onlineStore.ts';
import { clearStolenFromPlayerMap } from './npcAI.ts';
import { resetConveyor } from './conveyor.ts';

export function performRebirth(): boolean {
  const store = useGameStore.getState();
  if (!store.canRebirth()) return false;
  clearStolenFromPlayerMap();
  store.performRebirth();
  useWorldStore.getState().resetWorld();
  useGearStore.getState().resetGears();
  resetConveyor();
  useOnlineStore.getState().recalcAchievements();
  return true;
}

export function getNextRebirthInfo(): { level: number; cost: number; multiplier: number } | null {
  const store = useGameStore.getState();
  const nextLevel = store.rebirthLevel + 1;
  const tier = REBIRTH_TABLE.find(t => t.level === nextLevel);
  if (!tier) return null;
  return { level: nextLevel, cost: tier.cost, multiplier: tier.multiplier };
}
