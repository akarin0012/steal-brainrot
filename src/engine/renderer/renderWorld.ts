import { TILE_SIZE } from '../../utils/collision.ts';
import { INTERACTABLES } from '../../data/townMap.ts';
import type { InteractableObject, Direction, ConveyorItem, BrainrotDef, NPCState, Mutation } from '../../types/game.ts';
import { MAP_W, MAP_H } from './constants.ts';
import type { SlotInfo } from './types.ts';
import { drawMapTiles } from './drawMap.ts';
import { drawShieldBarrier, drawNPCShieldBarriers } from './drawShields.ts';
import { drawConveyorBelt, drawConveyorItems } from './drawConveyor.ts';
import { drawInteractableIcon } from './drawInteractables.ts';
import { drawNPC } from './drawNPC.ts';
import { drawPlayer } from './drawPlayer.ts';

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
): void {
  ctx.clearRect(0, 0, MAP_W * TILE_SIZE, MAP_H * TILE_SIZE);

  drawMapTiles(ctx);

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
