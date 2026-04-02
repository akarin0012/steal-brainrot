import type { Rarity } from '../types/game.ts';
import type { LiveEventDef } from '../types/game.ts';
import { useGameStore } from '../stores/gameStore.ts';
import { LIVE_EVENT_DEFS } from '../data/liveEvents.ts';
import { BRAINROT_MAP } from '../data/brainrots.ts';

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

interface LiveEventState {
  activeEventId: string | null;
  remainingSec: number;
  untilNextSec: number;
  nextEventIndex: number;
  activationSeq: number;
  claimedSeq: number;
}

const LIVE_EVENT_STORAGE_KEY = 'steal-brainrot-live-events-v1';
const LIVE_EVENT_ID_SET = new Set<string>(LIVE_EVENT_DEFS.map(e => e.id));

const liveEventState: LiveEventState = {
  activeEventId: null,
  remainingSec: 0,
  untilNextSec: LIVE_EVENT_DEFS[0]?.intervalSec ?? 900,
  nextEventIndex: 0,
  activationSeq: 0,
  claimedSeq: 0,
};

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

function persistLiveEventState() {
  try {
    localStorage.setItem(
      LIVE_EVENT_STORAGE_KEY,
      JSON.stringify({
        activeEventId: liveEventState.activeEventId,
        remainingSec: liveEventState.remainingSec,
        untilNextSec: liveEventState.untilNextSec,
        nextEventIndex: liveEventState.nextEventIndex,
        activationSeq: liveEventState.activationSeq,
        claimedSeq: liveEventState.claimedSeq,
      }),
    );
  } catch {
    // Ignore persistence failures.
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

function loadLiveEventState() {
  try {
    const raw = localStorage.getItem(LIVE_EVENT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<LiveEventState>;
    if (typeof parsed.activeEventId === 'string' && LIVE_EVENT_ID_SET.has(parsed.activeEventId)) {
      liveEventState.activeEventId = parsed.activeEventId;
    }
    if (typeof parsed.remainingSec === 'number' && Number.isFinite(parsed.remainingSec)) {
      liveEventState.remainingSec = Math.max(0, parsed.remainingSec);
    }
    if (typeof parsed.untilNextSec === 'number' && Number.isFinite(parsed.untilNextSec)) {
      liveEventState.untilNextSec = Math.max(0, parsed.untilNextSec);
    }
    if (typeof parsed.nextEventIndex === 'number' && Number.isFinite(parsed.nextEventIndex) && LIVE_EVENT_DEFS.length > 0) {
      liveEventState.nextEventIndex = Math.max(0, Math.floor(parsed.nextEventIndex) % LIVE_EVENT_DEFS.length);
    }
    if (typeof parsed.activationSeq === 'number' && Number.isFinite(parsed.activationSeq)) {
      liveEventState.activationSeq = Math.max(0, Math.floor(parsed.activationSeq));
    }
    if (typeof parsed.claimedSeq === 'number' && Number.isFinite(parsed.claimedSeq)) {
      liveEventState.claimedSeq = Math.max(0, Math.floor(parsed.claimedSeq));
    }
    if (liveEventState.activeEventId && liveEventState.remainingSec <= 0) {
      liveEventState.activeEventId = null;
    }
  } catch {
    // Ignore malformed payloads.
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
loadLiveEventState();

function startNextLiveEvent() {
  if (LIVE_EVENT_DEFS.length === 0) return;
  const idx = liveEventState.nextEventIndex % LIVE_EVENT_DEFS.length;
  const ev = LIVE_EVENT_DEFS[idx];
  liveEventState.activeEventId = ev.id;
  liveEventState.remainingSec = ev.durationSec;
  liveEventState.untilNextSec = 0;
  liveEventState.nextEventIndex = (idx + 1) % LIVE_EVENT_DEFS.length;
  liveEventState.activationSeq += 1;
}

function tickLiveEvents(dt: number) {
  if (LIVE_EVENT_DEFS.length === 0) return;
  if (liveEventState.activeEventId) {
    liveEventState.remainingSec = Math.max(0, liveEventState.remainingSec - dt);
    if (liveEventState.remainingSec <= 0) {
      const activeDef = LIVE_EVENT_DEFS.find(e => e.id === liveEventState.activeEventId);
      liveEventState.activeEventId = null;
      liveEventState.remainingSec = 0;
      liveEventState.untilNextSec = activeDef?.intervalSec ?? LIVE_EVENT_DEFS[0].intervalSec;
    }
    return;
  }
  liveEventState.untilNextSec = Math.max(0, liveEventState.untilNextSec - dt);
  if (liveEventState.untilNextSec <= 0) {
    startNextLiveEvent();
  }
}

export function tickEvents(dt: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
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
  tickLiveEvents(dt);
  persistTimerSec += dt;
  if (persistTimerSec >= 1) {
    persistTimerSec = 0;
    if (progressed) persistPityState();
    persistLiveEventState();
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
  liveEventState.activeEventId = null;
  liveEventState.remainingSec = 0;
  liveEventState.untilNextSec = LIVE_EVENT_DEFS[0]?.intervalSec ?? 900;
  liveEventState.nextEventIndex = 0;
  liveEventState.activationSeq = 0;
  liveEventState.claimedSeq = 0;
  persistTimerSec = 0;
  persistPityState();
  persistLiveEventState();
}

export function registerEvent(event: GameEvent) {
  events.push(event);
}

export function getLiveEventDefinitions(): LiveEventDef[] {
  return LIVE_EVENT_DEFS.map(ev => ({ ...ev }));
}

export function getActiveLiveEvent(): (LiveEventDef & { remainingSec: number; activationSeq: number }) | null {
  if (!liveEventState.activeEventId) return null;
  const ev = LIVE_EVENT_DEFS.find(e => e.id === liveEventState.activeEventId);
  if (!ev) return null;
  return {
    ...ev,
    remainingSec: liveEventState.remainingSec,
    activationSeq: liveEventState.activationSeq,
  };
}

export function getLiveEventUntilNextSec(): number {
  return liveEventState.untilNextSec;
}

export function getLiveIncomeMultiplier(): number {
  const active = getActiveLiveEvent();
  if (!active) return 1;
  const incomeEffect = active.effects.find(effect => effect.type === 'income_multiplier');
  if (!incomeEffect) return 1;
  return Math.max(1, incomeEffect.multiplier);
}

export function getActiveLiveEventSpawnPoolIds(): string[] {
  const active = getActiveLiveEvent();
  if (!active) return [];
  const poolEffect = active.effects.find(effect => effect.type === 'spawn_pool_override');
  if (!poolEffect) return [];
  return poolEffect.brainrotIds.filter(id => BRAINROT_MAP.has(id));
}

export function getLiveEventEffectSummary(ev: LiveEventDef): string[] {
  const lines: string[] = [];
  for (const effect of ev.effects) {
    if (effect.type === 'income_multiplier') {
      lines.push(`income ${effect.multiplier.toFixed(2)}x`);
      continue;
    }
    if (effect.type === 'spawn_pool_override') {
      lines.push(`event pool ${effect.brainrotIds.length} kinds`);
    }
  }
  return lines;
}

export function claimActiveLiveEventReward(): { ok: boolean; amount: number; reason?: string } {
  const active = getActiveLiveEvent();
  if (!active) return { ok: false, amount: 0, reason: 'No active event' };
  if (active.remainingSec <= 0) {
    return { ok: false, amount: 0, reason: 'Event already ended' };
  }
  if (liveEventState.claimedSeq === active.activationSeq) {
    return { ok: false, amount: 0, reason: 'Reward already claimed' };
  }
  const game = useGameStore.getState();
  const incomeEffect = active.effects.find(effect => effect.type === 'income_multiplier');
  const rewardMultiplier = incomeEffect ? Math.max(1, incomeEffect.multiplier) : 1;
  const base = Math.max(500, game.incomePerSec * 30);
  const amount = Math.floor(base * rewardMultiplier);
  if (amount <= 0) return { ok: false, amount: 0, reason: 'Reward unavailable' };
  game.addCurrency(amount);
  liveEventState.claimedSeq = active.activationSeq;
  persistLiveEventState();
  return { ok: true, amount };
}
