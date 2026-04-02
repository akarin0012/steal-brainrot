import type { LiveEventDef } from '../types/game.ts';

export const LIVE_EVENT_DEFS: LiveEventDef[] = [
  {
    id: 'starlight_surge',
    name: 'Starlight Surge',
    description: 'Conveyor spawns event-only cosmic brainrots for a short time.',
    intervalSec: 900,
    durationSec: 210,
    effects: [
      {
        type: 'spawn_pool_override',
        brainrotIds: ['ev_m01', 'ev_m02', 'ev_g01', 'ev_g02'],
      },
    ],
  },
  {
    id: 'gold_rush',
    name: 'Gold Rush',
    description: 'Passive income boosted while active.',
    intervalSec: 1200,
    durationSec: 180,
    effects: [
      {
        type: 'income_multiplier',
        multiplier: 1.5,
      },
    ],
  },
];
