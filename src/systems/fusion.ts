import type { Rarity, Mutation } from '../types/game.ts';
import { RARITY_ORDER } from '../data/rarities.ts';
import { ALL_BRAINROTS } from '../data/brainrots.ts';
import { rollMutation } from '../data/mutations.ts';

const FUSION_INPUT_COUNT = 4;

const FUSION_COST: Record<Rarity, number> = {
  common: 500,
  uncommon: 5_000,
  rare: 50_000,
  epic: 500_000,
  legendary: 5_000_000,
  mythic: 50_000_000,
  god: 500_000_000,
  secret: 200_000_000,
};

export function getFusionInputCount(): number {
  return FUSION_INPUT_COUNT;
}

export function getFusionCost(inputRarities: Rarity[]): number {
  let maxCost = 0;
  for (const r of inputRarities) {
    maxCost = Math.max(maxCost, FUSION_COST[r] ?? 500);
  }
  return maxCost;
}

export function performFusion(inputRarities: Rarity[]): { defId: string; rarity: Rarity; mutation?: Mutation } | null {
  if (inputRarities.length !== FUSION_INPUT_COUNT) return null;
  if (inputRarities.some(r => RARITY_ORDER.indexOf(r) === -1)) return null;

  const avgIdx = inputRarities.reduce((sum, r) => sum + RARITY_ORDER.indexOf(r), 0) / inputRarities.length;
  const baseIdx = Math.floor(avgIdx);

  const roll = Math.random();
  let resultIdx: number;

  if (roll < 0.35) {
    resultIdx = Math.min(baseIdx + 2, RARITY_ORDER.length - 1);
  } else if (roll < 0.70) {
    resultIdx = Math.min(baseIdx + 1, RARITY_ORDER.length - 1);
  } else {
    resultIdx = baseIdx;
  }

  const resultRarity = RARITY_ORDER[resultIdx];
  const pool = ALL_BRAINROTS.filter(b => b.rarity === resultRarity);
  const def = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : ALL_BRAINROTS[0];

  const mutation = Math.random() < 0.15 ? rollMutation() : undefined;

  return { defId: def.id, rarity: def.rarity, mutation };
}
