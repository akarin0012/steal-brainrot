import type { NPCState } from '../../types/game.ts';
import { BRAINROT_MAP } from '../../data/brainrots.ts';
import { RARITIES } from '../../data/rarities.ts';
import { getMutationDef } from '../../data/mutations.ts';
import { NPC_BASE_MAP } from '../../data/npcBases.ts';
import { NPC_SIZE } from './constants.ts';

export function drawNPC(ctx: CanvasRenderingContext2D, npc: NPCState): void {
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
  let ex = cx;
  let ey = cy;
  switch (npc.direction) {
    case 'up': ey = cy - eyeOffset; break;
    case 'down': ey = cy + eyeOffset; break;
    case 'left': ex = cx - eyeOffset; break;
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
