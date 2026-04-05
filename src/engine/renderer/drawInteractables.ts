import { TILE_SIZE } from '../../utils/collision.ts';
import type { InteractableObject, BrainrotDef, Mutation } from '../../types/game.ts';
import { RARITIES } from '../../data/rarities.ts';
import { getMutationDef } from '../../data/mutations.ts';
import type { SlotInfo } from './types.ts';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
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

export function drawInteractableIcon(
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
