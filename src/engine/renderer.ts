import { TILE_SIZE } from '../utils/collision.ts';
import { TOWN_MAP, TILE_DEFS, INTERACTABLES } from '../data/townMap.ts';
import type { InteractableObject, Direction, ConveyorItem, BrainrotDef, NPCState, Mutation } from '../types/game.ts';
import { BRAINROT_MAP } from '../data/brainrots.ts';
import { RARITIES } from '../data/rarities.ts';
import { getMutationDef } from '../data/mutations.ts';

export interface SlotInfo {
  def: BrainrotDef;
  mutation?: Mutation;
}
import { NPC_BASE_MAP } from '../data/npcBases.ts';
import { getConveyorBounds, getConveyorAnimOffset } from '../systems/conveyor.ts';
import { formatNumber } from '../utils/bigNumber.ts';

const PLAYER_SIZE = 24;
const NPC_SIZE = 24;
const MAP_W = TOWN_MAP[0].length;
const MAP_H = TOWN_MAP.length;

const HOME_ENTRANCE_ROW = 6;
const HOME_ENTRANCE_COLS = [22, 23, 24, 25, 26];

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  playerDir: Direction,
  _interactTarget: InteractableObject | null,
  conveyorItems: readonly ConveyorItem[],
  nearConveyorItem: ConveyorItem | null,
  slotContents: ReadonlyMap<string, SlotInfo | null>,
  shieldActive: boolean,
  carryingDef: BrainrotDef | null,
  npcs: readonly NPCState[],
  playerSlotCount = 8,
  carryingMutation?: Mutation,
) {
  ctx.clearRect(0, 0, MAP_W * TILE_SIZE, MAP_H * TILE_SIZE);

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tileId = TOWN_MAP[y][x];
      const def = TILE_DEFS[tileId];
      ctx.fillStyle = def?.color ?? '#000';
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  if (shieldActive) {
    drawShieldBarrier(ctx);
  }

  drawNPCShieldBarriers(ctx, npcs);

  drawConveyorBelt(ctx);
  drawConveyorItems(ctx, conveyorItems, nearConveyorItem);

  for (const obj of INTERACTABLES) {
    if (obj.type === 'brainrot_slot') {
      const idx = obj.data?.slotIndex as number;
      if (idx >= playerSlotCount) continue;
    }
    const ox = obj.tileX * TILE_SIZE;
    const oy = obj.tileY * TILE_SIZE;
    drawInteractableIcon(ctx, obj, ox, oy, slotContents);
  }

  for (const npc of npcs) {
    drawNPC(ctx, npc);
  }

  drawPlayer(ctx, playerX, playerY, playerDir, carryingDef, carryingMutation);
}

function drawShieldBarrier(ctx: CanvasRenderingContext2D) {
  const py = HOME_ENTRANCE_ROW * TILE_SIZE;
  const startX = HOME_ENTRANCE_COLS[0] * TILE_SIZE;
  const width = HOME_ENTRANCE_COLS.length * TILE_SIZE;
  const pulse = 0.35 + 0.15 * Math.sin(performance.now() / 400);

  ctx.fillStyle = `rgba(34, 211, 238, ${pulse})`;
  ctx.fillRect(startX, py, width, TILE_SIZE);

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, py, width, TILE_SIZE);

  const barWidth = 4;
  const barSpacing = 10;
  ctx.fillStyle = `rgba(6, 182, 212, ${pulse + 0.15})`;
  for (let bx = startX + barSpacing / 2; bx < startX + width; bx += barSpacing) {
    ctx.fillRect(bx - barWidth / 2, py + 2, barWidth, TILE_SIZE - 4);
  }
  ctx.lineWidth = 1;

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SHIELD', startX + width / 2, py + TILE_SIZE / 2 + 3);
}

function drawNPCShieldBarriers(ctx: CanvasRenderingContext2D, npcs: readonly NPCState[]) {
  const pulse = 0.35 + 0.15 * Math.sin(performance.now() / 400);

  for (const npc of npcs) {
    if (!npc.npcShield.active) continue;
    const base = NPC_BASE_MAP.get(npc.baseId);
    if (!base) continue;

    const bb = base.buildingBounds;
    const startX = bb.minCol * TILE_SIZE;
    const width = (bb.maxCol - bb.minCol + 1) * TILE_SIZE;
    const ey = base.entranceRow * TILE_SIZE;

    ctx.fillStyle = `rgba(34, 211, 238, ${pulse})`;
    ctx.fillRect(startX, ey, width, TILE_SIZE);

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, ey, width, TILE_SIZE);

    const barWidth = 4;
    const barSpacing = 10;
    ctx.fillStyle = `rgba(6, 182, 212, ${pulse + 0.15})`;
    for (let bx = startX + barSpacing / 2; bx < startX + width; bx += barSpacing) {
      ctx.fillRect(bx - barWidth / 2, ey + 2, barWidth, TILE_SIZE - 4);
    }
    ctx.lineWidth = 1;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SHIELD', startX + width / 2, ey + TILE_SIZE / 2 + 3);
  }
}

function drawConveyorBelt(ctx: CanvasRenderingContext2D) {
  const bounds = getConveyorBounds();
  const offset = getConveyorAnimOffset();
  const y = bounds.y;

  ctx.fillStyle = '#444';
  ctx.fillRect(bounds.left, y, bounds.right - bounds.left, TILE_SIZE);

  ctx.fillStyle = '#666';
  ctx.fillRect(bounds.left, y, bounds.right - bounds.left, 3);
  ctx.fillRect(bounds.left, y + TILE_SIZE - 3, bounds.right - bounds.left, 3);

  ctx.save();
  ctx.beginPath();
  ctx.rect(bounds.left, y, bounds.right - bounds.left, TILE_SIZE);
  ctx.clip();

  ctx.strokeStyle = '#777';
  ctx.lineWidth = 1;
  const stripeSpacing = 16;
  const totalLen = bounds.right - bounds.left + stripeSpacing;
  for (let sx = 0; sx < totalLen; sx += stripeSpacing) {
    const drawX = bounds.left + sx - offset;
    ctx.beginPath();
    ctx.moveTo(drawX + 4, y + 4);
    ctx.lineTo(drawX - 4, y + TILE_SIZE - 4);
    ctx.stroke();
  }
  ctx.restore();
  ctx.lineWidth = 1;

  ctx.fillStyle = '#888';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25C0 CONVEYOR', (bounds.left + bounds.right) / 2, y - 3);
}

function drawConveyorItems(
  ctx: CanvasRenderingContext2D,
  items: readonly ConveyorItem[],
  nearItem: ConveyorItem | null,
) {
  const bounds = getConveyorBounds();
  const beltCY = bounds.y + TILE_SIZE / 2;

  for (const item of items) {
    const def = BRAINROT_MAP.get(item.defId);
    if (!def) continue;
    const rarityDef = RARITIES[def.rarity];

    const isNear = nearItem?.id === item.id;
    const radius = isNear ? 12 : 10;

    if (isNear) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(item.x, beltCY, radius + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const itemMutDef = getMutationDef(item.mutation);
    if (itemMutDef) {
      ctx.strokeStyle = itemMutDef.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(item.x, beltCY, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    ctx.fillStyle = rarityDef.color;
    ctx.beginPath();
    ctx.arc(item.x, beltCY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rarityDef.glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(item.x, beltCY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(def.name.charAt(0), item.x, beltCY + 3);

    if (isNear) {
      const nearMutDef = getMutationDef(item.mutation);
      const mutLabel = nearMutDef ? ` [${nearMutDef.name}]` : '';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[F] $${formatNumber(item.cost)}`, item.x, bounds.y - 8);

      ctx.fillStyle = nearMutDef ? nearMutDef.color : rarityDef.color;
      ctx.font = '8px monospace';
      ctx.fillText(def.name + mutLabel, item.x, bounds.y + TILE_SIZE + 14);
    }
  }
}

function drawInteractableIcon(
  ctx: CanvasRenderingContext2D,
  obj: InteractableObject,
  x: number,
  y: number,
  slotContents: ReadonlyMap<string, SlotInfo | null>,
) {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const r = 8;

  switch (obj.type) {
    case 'shield_device':
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('S', cx, cy + 3);
      break;
    case 'brainrot_slot': {
      const info = slotContents.get(obj.id) ?? null;
      if (info) {
        drawSlotFilled(ctx, cx, cy, r, info.def, info.mutation);
      } else {
        drawSlotEmpty(ctx, cx, cy, r, '#fbbf24');
      }
      break;
    }
    case 'npc_building_slot': {
      const info = slotContents.get(obj.id) ?? null;
      if (info) {
        drawSlotFilled(ctx, cx, cy, r, info.def, info.mutation);
      } else {
        drawSlotEmpty(ctx, cx, cy, r, '#f87171');
      }
      break;
    }
    case 'npc_sign':
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 2, cy - 4, 4, 12);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(cx - 8, cy - 8, 16, 8);
      break;
    case 'fusion_machine':
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('F', cx, cy + 3);
      break;
  }
}

function drawSlotFilled(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, def: BrainrotDef, mutation?: Mutation) {
  const rarityDef = RARITIES[def.rarity];

  const slotMutDef = getMutationDef(mutation);
  if (slotMutDef) {
    ctx.strokeStyle = slotMutDef.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  ctx.fillStyle = rarityDef.color;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rarityDef.glowColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = '#000';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(def.name.charAt(0), cx, cy + 3);
}

function drawSlotEmpty(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
  ctx.lineWidth = 1;
  const [rr, gg, bb] = hexToRgb(color);
  ctx.fillStyle = `rgba(${rr},${gg},${bb},0.15)`;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

function drawNPC(ctx: CanvasRenderingContext2D, npc: NPCState) {
  const base = NPC_BASE_MAP.get(npc.baseId);
  if (!base) return;

  const cx = npc.x + NPC_SIZE / 2;
  const cy = npc.y + NPC_SIZE / 2;

  ctx.fillStyle = base.color;
  ctx.beginPath();
  ctx.arc(cx, cy, NPC_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, NPC_SIZE / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;

  const eyeOffset = 4;
  let ex = cx, ey = cy;
  switch (npc.direction) {
    case 'up':    ey = cy - eyeOffset; break;
    case 'down':  ey = cy + eyeOffset; break;
    case 'left':  ex = cx - eyeOffset; break;
    case 'right': ex = cx + eyeOffset; break;
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ex, ey, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(base.name.charAt(0), cx, cy + NPC_SIZE / 2 + 9);

  if (npc.carryingDefId) {
    const carryDef = BRAINROT_MAP.get(npc.carryingDefId);
    if (carryDef) {
      const rarityDef = RARITIES[carryDef.rarity];
      const bob = Math.sin(performance.now() / 250) * 1.5;
      const aboveY = cy - NPC_SIZE / 2 - 10 + bob;

      const npcMutDef = getMutationDef(npc.carryingMutation);
      if (npcMutDef) {
        ctx.strokeStyle = npcMutDef.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, aboveY, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      ctx.fillStyle = rarityDef.color;
      ctx.beginPath();
      ctx.arc(cx, aboveY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = rarityDef.glowColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, aboveY, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;

      ctx.fillStyle = '#000';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(carryDef.name.charAt(0), cx, aboveY + 2);
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, dir: Direction, carryingDef: BrainrotDef | null, carryMutation?: Mutation) {
  const cx = x + PLAYER_SIZE / 2;
  const cy = y + PLAYER_SIZE / 2;

  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(cx, cy, PLAYER_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0e7490';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, PLAYER_SIZE / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;

  const eyeOffset = 4;
  let ex = cx, ey = cy;
  switch (dir) {
    case 'up':    ey = cy - eyeOffset; break;
    case 'down':  ey = cy + eyeOffset; break;
    case 'left':  ex = cx - eyeOffset; break;
    case 'right': ex = cx + eyeOffset; break;
  }
  ctx.fillStyle = '#0e7490';
  ctx.beginPath();
  ctx.arc(ex, ey, 3, 0, Math.PI * 2);
  ctx.fill();

  if (carryingDef) {
    const rarityDef = RARITIES[carryingDef.rarity];
    const bob = Math.sin(performance.now() / 250) * 1.5;
    const aboveY = cy - PLAYER_SIZE / 2 - 10 + bob;

    const playerMutDef = getMutationDef(carryMutation);
    if (playerMutDef) {
      ctx.strokeStyle = playerMutDef.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, aboveY, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    ctx.fillStyle = rarityDef.color;
    ctx.beginPath();
    ctx.arc(cx, aboveY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rarityDef.glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, aboveY, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(carryingDef.name.charAt(0), cx, aboveY + 3);
  }
}

export { PLAYER_SIZE, NPC_SIZE, MAP_W, MAP_H };
