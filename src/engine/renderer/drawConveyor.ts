import { TILE_SIZE } from '../../utils/collision.ts';
import type { ConveyorItem } from '../../types/game.ts';
import { BRAINROT_MAP } from '../../data/brainrots.ts';
import { RARITIES } from '../../data/rarities.ts';
import { getMutationDef } from '../../data/mutations.ts';
import { getConveyorBounds, getConveyorAnimOffset } from '../../systems/conveyor.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export function drawConveyorBelt(ctx: CanvasRenderingContext2D): void {
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

export function drawConveyorItems(
  ctx: CanvasRenderingContext2D,
  items: readonly ConveyorItem[],
  nearItem: ConveyorItem | null,
): void {
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
