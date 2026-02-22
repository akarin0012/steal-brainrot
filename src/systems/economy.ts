import { useGameStore } from '../stores/gameStore.ts';

export function getUpgradeCost(upgradeId: string, baseCost: number, costMultiplier: number): number {
  const store = useGameStore.getState();
  const level = store.upgradeLevels[upgradeId] ?? 0;
  return Math.floor(baseCost * Math.pow(costMultiplier, level));
}
