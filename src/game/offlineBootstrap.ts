import { useGameStore } from '../stores/gameStore.ts';
import { useUIStore } from '../stores/uiStore.ts';
import { calcOfflineIncome } from '../systems/income.ts';

const LAST_SAVE_KEY = 'steal-brainrot-lastSave';
const OFFLINE_CLAIMED_KEY = 'steal-brainrot-offlineClaimed';
const MIN_OFFLINE_SECONDS = 10;

/**
 * Run once on app load: apply offline shield tick, optional offline income overlay, set last save time.
 */
export function runOfflineIncomeBootstrap(now = Date.now()): void {
  let lastSave = 0;
  let lastClaimed = 0;
  try {
    lastSave = Number(localStorage.getItem(LAST_SAVE_KEY) ?? '0') || 0;
    lastClaimed = Number(localStorage.getItem(OFFLINE_CLAIMED_KEY) ?? '0') || 0;
  } catch {
    /* private browsing */
  }

  if (lastSave > 0 && lastSave <= now && lastSave > lastClaimed) {
    const elapsed = Math.floor((now - lastSave) / 1000);
    if (elapsed >= MIN_OFFLINE_SECONDS) {
      useGameStore.getState().tickShield(elapsed);

      const income = calcOfflineIncome(lastSave);
      if (income > 0) {
        const capped = Math.min(elapsed, 7200);
        useGameStore.getState().addCurrency(income);
        useUIStore.getState().openOverlay('offline_income', { amount: income, seconds: capped });
      }
      try {
        localStorage.setItem(OFFLINE_CLAIMED_KEY, String(now));
      } catch {
        /* ignored */
      }
    }
  }
  useGameStore.getState().setLastSaveTime(now);
}
