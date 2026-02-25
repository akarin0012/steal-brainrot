import type { Rarity } from '../types/game.ts';
import { useGameStore } from '../stores/gameStore.ts';

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
  { rarity: 'legendary', intervalSec: 600 },
  { rarity: 'mythic',    intervalSec: 1800 },
];

const events: GameEvent[] = [];

const pityQueue: Rarity[] = [];
const PITY_STORAGE_KEY = 'steal-brainrot-pity-v1';
const PITY_RARITY_SET = new Set<Rarity>(PITY_CONFIG.map(cfg => cfg.rarity));

let pityConsumeSeq = 0;
let lastPityConsumed: { rarity: Rarity; consumedAt: number; sequence: number } | null = null;
let persistTimerSec = 0;

function persistPityState() {
  try {
    const payload = {
      events: events
        .filter(ev => ev.type === 'pity')
        .map(ev => ({ id: ev.id, elapsedSec: ev.elapsedSec })),
      pityQueue: [...pityQueue],
    };
    localStorage.setItem(PITY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore persistence failures (private mode / quota)
  }
}

function loadPityState() {
  try {
    const raw = localStorage.getItem(PITY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      events?: Array<{ id?: unknown; elapsedSec?: unknown }>;
      pityQueue?: unknown;
    };

    const elapsedById = new Map<string, number>();
    if (Array.isArray(parsed.events)) {
      for (const saved of parsed.events) {
        if (!saved || typeof saved.id !== 'string') continue;
        if (typeof saved.elapsedSec !== 'number' || !Number.isFinite(saved.elapsedSec)) continue;
        elapsedById.set(saved.id, Math.max(0, saved.elapsedSec));
      }
    }

    for (const ev of events) {
      if (ev.type !== 'pity') continue;
      const savedElapsed = elapsedById.get(ev.id);
      if (savedElapsed === undefined) continue;
      ev.elapsedSec = Math.min(savedElapsed, ev.intervalSec);
    }

    pityQueue.length = 0;
    if (Array.isArray(parsed.pityQueue)) {
      for (const entry of parsed.pityQueue) {
        if (typeof entry !== 'string') continue;
        const rarity = entry as Rarity;
        if (!PITY_RARITY_SET.has(rarity)) continue;
        if (!pityQueue.includes(rarity)) pityQueue.push(rarity);
      }
    }
  } catch {
    // Ignore malformed save payloads.
  }
}

function enqueuePity(rarity: Rarity) {
  if (!pityQueue.includes(rarity)) {
    pityQueue.push(rarity);
    persistPityState();
  }
}

export function dequeuePity(): Rarity | null {
  const rarity = pityQueue.shift() ?? null;
  if (!rarity) return null;
  pityConsumeSeq += 1;
  lastPityConsumed = { rarity, consumedAt: Date.now(), sequence: pityConsumeSeq };
  persistPityState();
  return rarity;
}

export function getPityQueueLength(): number {
  return pityQueue.length;
}

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
        enqueuePity(cfg.rarity);
      },
    });
  }
  loadPityState();
}

initPityTimers();

export function tickEvents(dt: number) {
  let progressed = false;
  for (const ev of events) {
    if (!ev.enabled()) continue;
    progressed = true;
    ev.elapsedSec += dt;
    if (ev.elapsedSec >= ev.intervalSec) {
      ev.elapsedSec = 0;
      ev.execute();
    }
  }
  if (progressed) {
    persistTimerSec += dt;
    if (persistTimerSec >= 1) {
      persistTimerSec = 0;
      persistPityState();
    }
  }
}

export function onBrainrotSpawned(rarity: Rarity) {
  const ev = events.find(e => e.type === 'pity' && e.id === `pity_${rarity}`);
  if (ev) {
    ev.elapsedSec = 0;
    persistPityState();
  }
}

export function getPityTimers(): {
  rarity: Rarity;
  elapsedSec: number;
  intervalSec: number;
  remainingSec: number;
  queued: boolean;
}[] {
  return PITY_CONFIG.map(cfg => {
    const ev = events.find(e => e.id === `pity_${cfg.rarity}`);
    const elapsedSec = ev?.elapsedSec ?? 0;
    const intervalSec = cfg.intervalSec;
    return {
      rarity: cfg.rarity,
      elapsedSec,
      intervalSec,
      remainingSec: Math.max(0, intervalSec - elapsedSec),
      queued: pityQueue.includes(cfg.rarity),
    };
  });
}

export function getLastPityConsumed(): { rarity: Rarity; consumedAt: number; sequence: number } | null {
  return lastPityConsumed;
}

export function resetAllEvents() {
  for (const ev of events) {
    ev.elapsedSec = 0;
  }
  pityQueue.length = 0;
  lastPityConsumed = null;
  persistTimerSec = 0;
  persistPityState();
}

export function registerEvent(event: GameEvent) {
  events.push(event);
}
