import type { Mutation } from '../types/game.ts';

export interface MutationDef {
  name: string;
  multiplier: number;
  color: string;
  glowColor: string;
  dropChance: number;
}

export const MUTATIONS: Record<Mutation, MutationDef> = {
  gold:    { name: 'Gold',    multiplier: 1.25, color: '#ffd700', glowColor: '#daa520', dropChance: 0.08 },
  diamond: { name: 'Diamond', multiplier: 1.5,  color: '#00bfff', glowColor: '#1e90ff', dropChance: 0.04 },
  lava:    { name: 'Lava',    multiplier: 6.0,  color: '#ff4500', glowColor: '#cc3700', dropChance: 0.004 },
  rainbow: { name: 'Rainbow', multiplier: 10.0, color: '#ff69b4', glowColor: '#da70d6', dropChance: 0.001 },
};

export const MUTATION_ORDER: Mutation[] = ['gold', 'diamond', 'lava', 'rainbow'];

export function rollMutation(): Mutation | undefined {
  const roll = Math.random();
  let cumulative = 0;
  for (const m of MUTATION_ORDER) {
    cumulative += MUTATIONS[m].dropChance;
    if (roll < cumulative) return m;
  }
  return undefined;
}

export function getMutationMultiplier(mutation?: Mutation): number {
  if (!mutation) return 1;
  return MUTATIONS[mutation].multiplier;
}
