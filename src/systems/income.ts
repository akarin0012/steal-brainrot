import { useGameStore } from '../stores/gameStore.ts';
import { useGearStore } from '../stores/gearStore.ts';

export function tickIncome(): void {
  const store = useGameStore.getState();
  if (store.incomePerSec > 0) {
    const incomeBoost = useGearStore.getState().getEffectValue('income_boost');
    const multiplier = incomeBoost > 0 ? incomeBoost : 1;
    store.addCurrency(store.incomePerSec * multiplier);
  }
}

export function calcOfflineIncome(lastSaveTime: number): number {
  const elapsed = Math.floor((Date.now() - lastSaveTime) / 1000);
  const capped = Math.min(elapsed, 7200);
  const store = useGameStore.getState();
  return store.incomePerSec * capped;
}
