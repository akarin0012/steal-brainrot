import type { Direction, BrainrotDef, Mutation } from '../../types/game.ts';
import { RARITIES } from '../../data/rarities.ts';
import { getMutationDef } from '../../data/mutations.ts';
import { PLAYER_SIZE } from './constants.ts';

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Direction,
  carryingDef: BrainrotDef | null,
  carryMutation?: Mutation,
): void {
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
  let ex = cx;
  let ey = cy;
  switch (dir) {
    case 'up': ey = cy - eyeOffset; break;
    case 'down': ey = cy + eyeOffset; break;
    case 'left': ex = cx - eyeOffset; break;
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
