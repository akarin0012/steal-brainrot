export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'god' | 'secret';

export type Mutation = 'gold' | 'diamond' | 'lava' | 'rainbow';

export interface BrainrotDef {
  id: string;
  name: string;
  rarity: Rarity;
  baseIncomePerSec: number;
  cost: number;
  stealDifficulty: number;
  description: string;
  color: string;
}

export interface OwnedBrainrot {
  defId: string;
  instanceId: string;
  acquiredAt: number;
  source: 'conveyor' | 'steal' | 'fusion';
  mutation?: Mutation;
}

export interface ConveyorItem {
  id: string;
  defId: string;
  x: number;
  cost: number;
  mutation?: Mutation;
}

export interface TileDef {
  id: number;
  walkable: boolean;
  type: 'ground' | 'wall' | 'floor' | 'entrance' | 'water' | 'path' | 'conveyor';
  color: string;
}

export type InteractableType =
  | 'conveyor_item'
  | 'shield_device'
  | 'brainrot_slot'
  | 'npc_sign'
  | 'npc_building_slot'
  | 'fusion_machine';

export interface InteractableObject {
  id: string;
  tileX: number;
  tileY: number;
  type: InteractableType;
  label: string;
  data?: Record<string, unknown>;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type OverlayType =
  | 'none'
  | 'upgrade'
  | 'rebirth'
  | 'collection'
  | 'slot_detail'
  | 'npc_base_steal'
  | 'offline_income'
  | 'base_info'
  | 'slot_replace'
  | 'fusion'
  | 'debug';

export interface OverlayDataMap {
  none: Record<string, never>;
  upgrade: Record<string, never>;
  rebirth: Record<string, never>;
  collection: Record<string, never>;
  fusion: Record<string, never>;
  debug: Record<string, never>;
  slot_detail: { slotIndex: number };
  npc_base_steal: { baseId: string; slotIndex: number; npcId: string };
  offline_income: { amount: number; seconds: number };
  base_info: { baseId: string };
  slot_replace: { defId: string; mutation?: Mutation };
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme' | 'secret';

export type NPCBehaviorState = 'idle' | 'going_to_conveyor' | 'roaming' | 'carrying_home' | 'steal_attempt' | 'npc_steal' | 'chasing_thief';

export interface NPCShieldState {
  active: boolean;
  remainingSec: number;
  pendingActivation: boolean;
  inactiveSec: number;
}

export interface NPCBaseDef {
  id: string;
  name: string;
  difficulty: Difficulty;
  moveSpeed: number;
  buyInterval: number;
  stealChance: number;
  preferMinRarity: Rarity;
  preferMaxRarity: Rarity;
  initialCurrency: number;
  buildingBounds: { minCol: number; maxCol: number; minRow: number; maxRow: number };
  entranceCol: number;
  entranceRow: number;
  pathCol: number;
  color: string;
  shieldDuration: number;
  shieldCost: number;
}

export interface NPCSlotItem {
  defId: string;
  mutation?: Mutation;
}

export interface NPCState {
  id: string;
  baseId: string;
  x: number;
  y: number;
  direction: Direction;
  state: NPCBehaviorState;
  currency: number;
  carryingDefId: string | null;
  carryingMutation?: Mutation;
  buildingSlots: (NPCSlotItem | null)[];
  incomePerSec: number;
  stateTimer: number;
  pauseTimer: number;
  npcStealTimer: number;
  npcStealTarget: string | null;
  pendingChase: { thiefId: string; stolenSlotIdx: number; stolenDefId: string; stolenMutation?: Mutation; stolenInstanceId?: string } | null;
  waypoints: { x: number; y: number }[];
  waypointIndex: number;
  npcShield: NPCShieldState;
}

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effect: string;
  effectValue: number;
}

export interface CollectionEntry {
  brainrotId: string;
  discovered: boolean;
  firstDiscoveredAt: number | null;
  timesObtained: number;
}
