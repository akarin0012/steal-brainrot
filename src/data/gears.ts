export interface GearDef {
  id: string;
  name: string;
  description: string;
  rebirthRequired: number;
  cooldownSec: number;
  durationSec: number;
  effect: 'speed_boost' | 'npc_stun' | 'shield_instant' | 'income_boost';
  effectValue: number;
  cost: number;
}

export const ALL_GEARS: GearDef[] = [
  {
    id: 'speed_coil',
    name: 'Gravity Coil',
    description: '+60% movement speed for 10s',
    rebirthRequired: 1,
    cooldownSec: 30,
    durationSec: 10,
    effect: 'speed_boost',
    effectValue: 0.6,
    cost: 500,
  },
  {
    id: 'iron_slap',
    name: 'Iron Slap',
    description: 'Stun all NPCs for 5s',
    rebirthRequired: 2,
    cooldownSec: 60,
    durationSec: 5,
    effect: 'npc_stun',
    effectValue: 5,
    cost: 5_000,
  },
  {
    id: 'shield_potion',
    name: 'Shield Potion',
    description: 'Instant shield for 30s',
    rebirthRequired: 3,
    cooldownSec: 90,
    durationSec: 30,
    effect: 'shield_instant',
    effectValue: 30,
    cost: 25_000,
  },
  {
    id: 'golden_aura',
    name: 'Golden Aura',
    description: '3x income for 15s',
    rebirthRequired: 5,
    cooldownSec: 120,
    durationSec: 15,
    effect: 'income_boost',
    effectValue: 3,
    cost: 100_000,
  },
  {
    id: 'ruby_slap',
    name: 'Ruby Slap',
    description: 'Stun all NPCs for 10s',
    rebirthRequired: 7,
    cooldownSec: 45,
    durationSec: 10,
    effect: 'npc_stun',
    effectValue: 10,
    cost: 500_000,
  },
  {
    id: 'hyper_coil',
    name: 'Hyper Coil',
    description: '+100% movement speed for 12s',
    rebirthRequired: 10,
    cooldownSec: 25,
    durationSec: 12,
    effect: 'speed_boost',
    effectValue: 1.0,
    cost: 2_000_000,
  },
];

export const GEAR_MAP = new Map(ALL_GEARS.map(g => [g.id, g]));
