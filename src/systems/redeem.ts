import { useGameStore } from '../stores/gameStore.ts';

interface RedeemCodeDef {
  code: string;
  rewardCurrency: number;
}

const CODE_DEFS: RedeemCodeDef[] = [
  { code: 'WELCOME100K', rewardCurrency: 100_000 },
  { code: 'GEARSTART', rewardCurrency: 250_000 },
  { code: 'FUSIONBOOST', rewardCurrency: 1_000_000 },
];

const CODE_MAP = new Map(CODE_DEFS.map(def => [def.code, def]));
const REDEEM_STORAGE_KEY = 'steal-brainrot-redeem-claimed-v1';
const claimed = new Set<string>();

function loadClaimedCodes() {
  claimed.clear();
  try {
    const raw = localStorage.getItem(REDEEM_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    for (const entry of parsed) {
      if (typeof entry !== 'string') continue;
      if (!CODE_MAP.has(entry)) continue;
      claimed.add(entry);
    }
  } catch {
    // Ignore malformed data.
  }
}

function persistClaimedCodes() {
  try {
    localStorage.setItem(REDEEM_STORAGE_KEY, JSON.stringify([...claimed]));
  } catch {
    // Ignore persistence failures.
  }
}

export function redeemCode(rawCode: string): { ok: boolean; message: string; amount?: number } {
  loadClaimedCodes();
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, message: 'Enter a code first' };
  const def = CODE_MAP.get(code);
  if (!def) return { ok: false, message: 'Invalid code' };
  if (claimed.has(code)) return { ok: false, message: 'Code already redeemed' };

  useGameStore.getState().addCurrency(def.rewardCurrency);
  claimed.add(code);
  persistClaimedCodes();
  return { ok: true, message: `Redeemed $${def.rewardCurrency.toLocaleString()}`, amount: def.rewardCurrency };
}
