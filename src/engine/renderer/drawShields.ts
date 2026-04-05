import { TILE_SIZE } from '../../utils/collision.ts';
import { HOME_BOUNDS } from '../../data/townMap.ts';
import type { NPCState } from '../../types/game.ts';
import { NPC_BASE_MAP } from '../../data/npcBases.ts';

export function drawShieldBarrier(ctx: CanvasRenderingContext2D): void {
  const startX = HOME_BOUNDS.minCol * TILE_SIZE;
  const width = (HOME_BOUNDS.maxCol - HOME_BOUNDS.minCol + 1) * TILE_SIZE;
  const py = HOME_BOUNDS.maxRow * TILE_SIZE;
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

export function drawNPCShieldBarriers(ctx: CanvasRenderingContext2D, npcs: readonly NPCState[]): void {
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
    ctx.fillText(`SHIELD ${Math.ceil(npc.npcShield.remainingSec)}s`, startX + width / 2, ey + TILE_SIZE / 2 + 3);
  }
}
