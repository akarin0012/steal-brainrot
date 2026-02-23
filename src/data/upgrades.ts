import type { UpgradeDef } from '../types/game.ts';

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'npc_deterrent',
    name: 'NPC Deterrent',
    description: 'NPCs steal from you 30% less often.',
    baseCost: 10000,
    costMultiplier: 4,
    maxLevel: 3,
    effect: 'npc_deterrent',
    effectValue: -0.3,
  },
  {
    id: 'carry_speed',
    name: 'Carry Speed+',
    description: 'Move 10% faster while carrying a Brainrot.',
    baseCost: 12000,
    costMultiplier: 4,
    maxLevel: 3,
    effect: 'carry_speed',
    effectValue: 0.1,
  },
];
