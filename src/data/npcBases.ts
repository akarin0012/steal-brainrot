import type { NPCBaseDef } from '../types/game.ts';

const NPC_MOVE_SPEED = 120;
const NPC_SHIELD_DURATION = 60;
const NPC_SHIELD_COST = 0;
const NPC_BUY_INTERVAL = 4;
const NPC_STEAL_CHANCE = 0.025;
const NPC_INITIAL_CURRENCY = 2000000;

type NPCBaseLayout = Pick<NPCBaseDef, 'buildingBounds' | 'entranceCol' | 'entranceRow' | 'pathCol'>;
type NPCBaseVariant = Pick<NPCBaseDef, 'id' | 'name' | 'color'> & NPCBaseLayout;

const BASE_PRESET: Omit<
  NPCBaseDef,
  'id' | 'name' | 'color' | 'buildingBounds' | 'entranceCol' | 'entranceRow' | 'pathCol'
> = {
  difficulty: 'extreme',
  moveSpeed: NPC_MOVE_SPEED,
  buyInterval: NPC_BUY_INTERVAL,
  stealChance: NPC_STEAL_CHANCE,
  preferMinRarity: 'common',
  preferMaxRarity: 'secret',
  initialCurrency: NPC_INITIAL_CURRENCY,
  shieldDuration: NPC_SHIELD_DURATION,
  shieldCost: NPC_SHIELD_COST,
};

function createNPCBase(variant: NPCBaseVariant): NPCBaseDef {
  return {
    ...BASE_PRESET,
    ...variant,
  };
}

export const NPC_BASES: NPCBaseDef[] = [
  createNPCBase({
    id: 'base_ul',
    name: 'Yunah',
    buildingBounds: { minCol: 7, maxCol: 11, minRow: 3, maxRow: 6 },
    entranceCol: 9,
    entranceRow: 6,
    pathCol: 9,
    color: '#ef4444',
  }),
  createNPCBase({
    id: 'base_ur',
    name: 'Minju',
    buildingBounds: { minCol: 38, maxCol: 42, minRow: 3, maxRow: 6 },
    entranceCol: 40,
    entranceRow: 6,
    pathCol: 40,
    color: '#f97316',
  }),
  createNPCBase({
    id: 'base_ll',
    name: 'Moka',
    buildingBounds: { minCol: 7, maxCol: 11, minRow: 23, maxRow: 26 },
    entranceCol: 9,
    entranceRow: 23,
    pathCol: 9,
    color: '#a855f7',
  }),
  createNPCBase({
    id: 'base_lc',
    name: 'Wonhee',
    buildingBounds: { minCol: 22, maxCol: 26, minRow: 23, maxRow: 26 },
    entranceCol: 24,
    entranceRow: 23,
    pathCol: 24,
    color: '#ec4899',
  }),
  createNPCBase({
    id: 'base_lr',
    name: 'Iroha',
    buildingBounds: { minCol: 38, maxCol: 42, minRow: 23, maxRow: 26 },
    entranceCol: 40,
    entranceRow: 23,
    pathCol: 40,
    color: '#dc2626',
  }),
];

export const NPC_BASE_MAP = new Map(NPC_BASES.map(b => [b.id, b]));
