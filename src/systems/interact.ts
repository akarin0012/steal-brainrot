import { INTERACTABLES } from '../data/townMap.ts';
import { useWorldStore } from '../stores/worldStore.ts';
import { useUIStore } from '../stores/uiStore.ts';
import { useGameStore } from '../stores/gameStore.ts';
import { TILE_SIZE } from '../utils/collision.ts';
import { isNPCHome, findCarryingNPCNearPlayer, stealFromCarryingNPC, recoverFromNPC } from './npcAI.ts';
import type { InteractableObject, Direction, Mutation } from '../types/game.ts';

function getActiveInteractables(): InteractableObject[] {
  const slotCount = useGameStore.getState().getPlayerSlotCount();
  return INTERACTABLES.filter(obj => {
    if (obj.type !== 'brainrot_slot') return true;
    const idx = obj.data?.slotIndex as number;
    return idx < slotCount;
  });
}

const INTERACT_RANGE = TILE_SIZE * 1.5;

function getFacingTile(px: number, py: number, dir: Direction): { tx: number; ty: number } {
  const playerTileX = Math.floor((px + 12) / TILE_SIZE);
  const playerTileY = Math.floor((py + 12) / TILE_SIZE);
  switch (dir) {
    case 'up':    return { tx: playerTileX, ty: playerTileY - 1 };
    case 'down':  return { tx: playerTileX, ty: playerTileY + 1 };
    case 'left':  return { tx: playerTileX - 1, ty: playerTileY };
    case 'right': return { tx: playerTileX + 1, ty: playerTileY };
  }
}

export function findNearbyInteractable(): InteractableObject | null {
  const world = useWorldStore.getState();
  const facing = getFacingTile(world.playerX, world.playerY, world.playerDir);

  const playerCX = world.playerX + 12;
  const playerCY = world.playerY + 12;

  let closest: InteractableObject | null = null;
  let closestDist = Infinity;

  for (const obj of getActiveInteractables()) {
    const objCX = obj.tileX * TILE_SIZE + TILE_SIZE / 2;
    const objCY = obj.tileY * TILE_SIZE + TILE_SIZE / 2;
    const dist = Math.sqrt((playerCX - objCX) ** 2 + (playerCY - objCY) ** 2);

    if (dist < INTERACT_RANGE) {
      if (obj.tileX === facing.tx && obj.tileY === facing.ty) {
        return obj;
      }
      if (dist < closestDist) {
        closestDist = dist;
        closest = obj;
      }
    }
  }

  return closest;
}

export function findNearbyCarryingNPC(): { npcId: string; defId: string; mutation?: Mutation } | null {
  const npc = findCarryingNPCNearPlayer();
  if (!npc || !npc.carryingDefId) return null;
  return { npcId: npc.id, defId: npc.carryingDefId, mutation: npc.carryingMutation };
}

export function executeInteract(obj: InteractableObject): void {
  const ui = useUIStore.getState();

  switch (obj.type) {
    case 'shield_device': {
      const store = useGameStore.getState();
      if (store.shield.active) {
        store.extendShield();
      } else {
        store.activateShield();
      }
      break;
    }
    case 'brainrot_slot':
      ui.openOverlay('slot_detail', { slotIndex: (obj.data?.slotIndex as number) ?? 0 });
      break;
    case 'npc_building_slot': {
      const baseId = obj.data?.baseId as string;
      const slotIndex = obj.data?.slotIndex as number;
      const npcId = `npc_${baseId}`;
      const npcHome = isNPCHome(npcId);
      if (npcHome) {
        break;
      }
      ui.openOverlay('npc_base_steal', { baseId, slotIndex, npcId });
      break;
    }
    case 'npc_sign':
      ui.openOverlay('base_info', obj.data ?? {});
      break;
    case 'fusion_machine':
      ui.openOverlay('fusion');
      break;
    default:
      break;
  }
}

export function executeNPCSteal(npcId: string): { defId: string; mutation?: Mutation } | null {
  return stealFromCarryingNPC(npcId);
}

export function tryRecoverFromNPC(npcId: string): boolean {
  return recoverFromNPC(npcId);
}
