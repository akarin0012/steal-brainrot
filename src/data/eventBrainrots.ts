import type { BrainrotDef } from '../types/game.ts';
import { RARITIES, RARITY_ORDER } from './rarities.ts';

function eventBr(
  id: string,
  name: string,
  rarity: BrainrotDef['rarity'],
  income: number,
  cost: number,
  desc: string,
): BrainrotDef {
  return {
    id,
    name,
    rarity,
    baseIncomePerSec: income,
    cost,
    stealDifficulty: Math.ceil((RARITY_ORDER.indexOf(rarity) + 1) * 1.2),
    description: desc,
    color: RARITIES[rarity].color,
  };
}

export const EVENT_BRAINROTS: BrainrotDef[] = [
  eventBr('ev_m01', 'Meteor Mozzarella', 'mythic', 220000, 50000000, 'Falls from event skies with blazing cheese dust.'),
  eventBr('ev_m02', 'Comet Cannoli', 'mythic', 260000, 62000000, 'A sugar comet that streaks across the conveyor.'),
  eventBr('ev_g01', 'Nebula Noodles', 'god', 720000, 180000000, 'A cosmic noodle storm only seen during events.'),
  eventBr('ev_g02', 'Solar Spaghettus', 'god', 840000, 220000000, 'Solar-charged pasta deity from a limited portal.'),
];
