import type { SlotInfo } from '../engine/renderer.ts';
import { BRAINROT_MAP } from '../data/brainrots.ts';
import { NPC_BASE_MAP } from '../data/npcBases.ts';
import { useGameStore } from '../stores/gameStore.ts';
import { useWorldStore } from '../stores/worldStore.ts';

type GameSnapshot = ReturnType<typeof useGameStore.getState>;
type WorldSnapshot = ReturnType<typeof useWorldStore.getState>;

export function buildSlotContentsMap(game: GameSnapshot, world: WorldSnapshot): Map<string, SlotInfo | null> {
  const slotContents = new Map<string, SlotInfo | null>();

  const ownedMap = new Map(game.ownedBrainrots.map(b => [b.instanceId, b]));
  game.buildingSlots.forEach((instId, i) => {
    const slotId = `slot_${i}`;
    if (!instId) {
      slotContents.set(slotId, null);
      return;
    }
    const ownedItem = ownedMap.get(instId);
    if (!ownedItem) {
      slotContents.set(slotId, null);
      return;
    }
    const def = BRAINROT_MAP.get(ownedItem.defId);
    slotContents.set(slotId, def ? { def, mutation: ownedItem.mutation } : null);
  });

  for (const npc of world.npcs) {
    const base = NPC_BASE_MAP.get(npc.baseId);
    if (!base) continue;
    npc.buildingSlots.forEach((slot, i) => {
      const slotId = `${npc.baseId}_slot_${i}`;
      const def = slot ? BRAINROT_MAP.get(slot.defId) : null;
      slotContents.set(slotId, def ? { def, mutation: slot?.mutation } : null);
    });
  }

  return slotContents;
}
