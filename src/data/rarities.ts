import type { Rarity } from '../types/game.ts';

export interface RarityDef {
  name: string;
  color: string;
  glowColor: string;
  baseIncome: number;
  dropRate: number;
}

export const RARITIES: Record<Rarity, RarityDef> = {
  common:    { name: 'Common',    color: '#9ca3af', glowColor: '#6b7280', baseIncome: 1,      dropRate: 0.7000   },
  uncommon:  { name: 'Uncommon',  color: '#4ade80', glowColor: '#22c55e', baseIncome: 5,      dropRate: 0.2300   },
  rare:      { name: 'Rare',      color: '#60a5fa', glowColor: '#3b82f6', baseIncome: 25,     dropRate: 0.0600   },
  epic:      { name: 'Epic',      color: '#c084fc', glowColor: '#a855f7', baseIncome: 150,    dropRate: 0.0085   },
  legendary: { name: 'Legendary', color: '#fbbf24', glowColor: '#f59e0b', baseIncome: 1000,   dropRate: 0.0010   },
  mythic:    { name: 'Mythic',    color: '#f87171', glowColor: '#ef4444', baseIncome: 8000,   dropRate: 0.0004   },
  god:       { name: 'God',       color: '#e879f9', glowColor: '#d946ef', baseIncome: 80000,  dropRate: 0.0001   },
  secret:    { name: 'Secret',    color: '#fde68a', glowColor: '#fcd34d', baseIncome: 500000, dropRate: 0.000015 },
};

export const RARITY_ORDER: Rarity[] = [
  'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'god', 'secret',
];
