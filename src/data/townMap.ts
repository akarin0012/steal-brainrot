import type { TileDef, InteractableObject } from '../types/game.ts';

export const TILE_DEFS: Record<number, TileDef> = {
  0: { id: 0, walkable: true,  type: 'ground',   color: '#4a7c59' },  // grass
  1: { id: 1, walkable: false, type: 'wall',      color: '#6b5b4f' },  // building wall
  2: { id: 2, walkable: true,  type: 'floor',     color: '#c4a882' },  // building floor
  3: { id: 3, walkable: true,  type: 'entrance',  color: '#8b7355' },  // doorway
  4: { id: 4, walkable: true,  type: 'path',      color: '#b8a088' },  // stone path
  5: { id: 5, walkable: false, type: 'water',     color: '#4a90d9' },  // water
  6: { id: 6, walkable: false, type: 'wall',      color: '#8b4513' },  // dark wall (NPC bases)
  7: { id: 7, walkable: true,  type: 'floor',     color: '#a08060' },  // NPC base floor
  8: { id: 8, walkable: true,  type: 'conveyor',  color: '#555555' },  // conveyor belt (walkable)
};

// 50 columns x 30 rows
// 0=grass, 1=wall, 2=floor, 3=entrance, 4=path, 5=water, 6=dark wall, 7=NPC floor, 8=conveyor
const G = 0, W = 1, F = 2, E = 3, P = 4, D = 6, N = 7, C = 8;

// Layout: symmetric across Row 15 (conveyor belt)
// Upper-center: Player Home (all functions) — cols 21-27
// Other 5 buildings: NPC bases (D/N tiles)
// Buildings: 7 wide (cols 6-12, 21-27, 37-43), 5 tall
// Entrances at col 9, 24, 40
// Main horizontal paths at row 8 (upper) and row 21 (lower)
// Vertical paths at col 9, 24, 40

export const TOWN_MAP: number[][] = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49
  [G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G], // 0
  [G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G], // 1
  [G, G, G, G, G, G, D, D, D, D, D, D, D, G, G, G, G, G, G, G, G, W, W, W, W, W, W, W, G, G, G, G, G, G, G, G, G, D, D, D, D, D, D, D, G, G, G, G, G, G], // 2
  [G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G, G, G, W, F, F, F, F, F, W, G, G, G, G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G], // 3
  [G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G, G, G, W, F, F, F, F, F, W, G, G, G, G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G], // 4
  [G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G, G, G, W, F, F, F, F, F, W, G, G, G, G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G], // 5
  [G, G, G, G, G, G, D, N, N, E, N, N, D, G, G, G, G, G, G, G, G, W, F, F, F, F, F, W, G, G, G, G, G, G, G, G, G, D, N, N, E, N, N, D, G, G, G, G, G, G], // 6
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 7
  [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 8
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 9
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 10
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 11
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 12
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 13
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 14
  [C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C], // 15
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 16
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 17
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 18
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 19
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 20
  [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 21
  [G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G], // 22
  [G, G, G, G, G, G, D, N, N, E, N, N, D, G, G, G, G, G, G, G, G, D, N, N, E, N, N, D, G, G, G, G, G, G, G, G, G, D, N, N, E, N, N, D, G, G, G, G, G, G], // 23
  [G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G], // 24
  [G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G], // 25
  [G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G, G, G, G, D, N, N, N, N, N, D, G, G, G, G, G, G], // 26
  [G, G, G, G, G, G, D, D, D, D, D, D, D, G, G, G, G, G, G, G, G, D, D, D, D, D, D, D, G, G, G, G, G, G, G, G, G, D, D, D, D, D, D, D, G, G, G, G, G, G], // 27
  [G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G], // 28
  [G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G], // 29
];

export const BASE_SLOT_COUNT = 8;
export const MAX_SLOT_COUNT = 16;

function npcSlots(baseId: string, leftCol: number, rightCol: number, backRow: number, isUpper: boolean): InteractableObject[] {
  const rowDir = isUpper ? 1 : -1;
  return [
    { id: `${baseId}_slot_0`, tileX: leftCol,     tileY: backRow,                type: 'npc_building_slot', label: 'NPC Slot 1', data: { baseId, slotIndex: 0 } },
    { id: `${baseId}_slot_1`, tileX: leftCol,     tileY: backRow + rowDir,       type: 'npc_building_slot', label: 'NPC Slot 2', data: { baseId, slotIndex: 1 } },
    { id: `${baseId}_slot_2`, tileX: leftCol,     tileY: backRow + rowDir * 2,   type: 'npc_building_slot', label: 'NPC Slot 3', data: { baseId, slotIndex: 2 } },
    { id: `${baseId}_slot_3`, tileX: leftCol + 1, tileY: backRow,                type: 'npc_building_slot', label: 'NPC Slot 4', data: { baseId, slotIndex: 3 } },
    { id: `${baseId}_slot_4`, tileX: rightCol - 1, tileY: backRow,               type: 'npc_building_slot', label: 'NPC Slot 5', data: { baseId, slotIndex: 4 } },
    { id: `${baseId}_slot_5`, tileX: rightCol,    tileY: backRow,                type: 'npc_building_slot', label: 'NPC Slot 6', data: { baseId, slotIndex: 5 } },
    { id: `${baseId}_slot_6`, tileX: rightCol,    tileY: backRow + rowDir,       type: 'npc_building_slot', label: 'NPC Slot 7', data: { baseId, slotIndex: 6 } },
    { id: `${baseId}_slot_7`, tileX: rightCol,    tileY: backRow + rowDir * 2,   type: 'npc_building_slot', label: 'NPC Slot 8', data: { baseId, slotIndex: 7 } },
  ];
}

export const ALL_PLAYER_SLOT_POSITIONS: { tileX: number; tileY: number }[] = [
  { tileX: 22, tileY: 3 }, { tileX: 22, tileY: 4 }, { tileX: 22, tileY: 5 },
  { tileX: 23, tileY: 3 },
  { tileX: 25, tileY: 3 },
  { tileX: 26, tileY: 3 }, { tileX: 26, tileY: 4 }, { tileX: 26, tileY: 5 },
  { tileX: 23, tileY: 4 }, { tileX: 25, tileY: 4 },
  { tileX: 23, tileY: 5 }, { tileX: 25, tileY: 5 },
  { tileX: 22, tileY: 6 }, { tileX: 26, tileY: 6 },
  { tileX: 24, tileY: 3 }, { tileX: 24, tileY: 5 },
];

function buildPlayerSlots(): InteractableObject[] {
  return ALL_PLAYER_SLOT_POSITIONS.map((pos, i) => ({
    id: `slot_${i}`,
    tileX: pos.tileX,
    tileY: pos.tileY,
    type: 'brainrot_slot' as const,
    label: `Slot ${i + 1}`,
    data: { slotIndex: i },
  }));
}

export const INTERACTABLES: InteractableObject[] = [
  ...buildPlayerSlots(),
  { id: 'home_shield', tileX: 24, tileY: 4, type: 'shield_device', label: 'Shield Generator' },
  { id: 'home_fusion', tileX: 24, tileY: 6, type: 'fusion_machine', label: 'Fusion Machine' },

  // NPC base signs (upper-left, upper-right: row 7 path; lower 3: row 22 path)
  { id: 'sign_ul',  tileX: 9,  tileY: 7,  type: 'npc_sign', label: 'Shady Shack (Extreme)',            data: { baseId: 'base_ul' } },
  { id: 'sign_ur',  tileX: 40, tileY: 7,  type: 'npc_sign', label: 'Guarded Garage (Extreme)',          data: { baseId: 'base_ur' } },
  { id: 'sign_ll',  tileX: 9,  tileY: 22, type: 'npc_sign', label: 'Fortified Fortress (Extreme)',      data: { baseId: 'base_ll' } },
  { id: 'sign_lc',  tileX: 24, tileY: 22, type: 'npc_sign', label: 'Maximum Security (Extreme)',        data: { baseId: 'base_lc' } },
  { id: 'sign_lr',  tileX: 40, tileY: 22, type: 'npc_sign', label: '??? (Extreme)',                     data: { baseId: 'base_lr' } },

  // NPC Building Slots (8 per building, wall-mounted like player home)
  // Upper-left (base_ul): interior cols 7-11, back row 3, entrance at bottom
  ...npcSlots('base_ul', 7, 11, 3, true),
  // Upper-right (base_ur): interior cols 38-42, back row 3, entrance at bottom
  ...npcSlots('base_ur', 38, 42, 3, true),
  // Lower-left (base_ll): interior cols 7-11, back row 26, entrance at top
  ...npcSlots('base_ll', 7, 11, 26, false),
  // Lower-center (base_lc): interior cols 22-26, back row 26, entrance at top
  ...npcSlots('base_lc', 22, 26, 26, false),
  // Lower-right (base_lr): interior cols 38-42, back row 26, entrance at top
  ...npcSlots('base_lr', 38, 42, 26, false),
];

export const CONVEYOR_ROW = 15;
export const CONVEYOR_START_COL = 0;
export const CONVEYOR_END_COL = 49;

export const HOME_BOUNDS = {
  minCol: 22, maxCol: 26,
  minRow: 3,  maxRow: 6,
};

export const PLAYER_START = { x: 24 * 32 + 4, y: 8 * 32 + 4 };
