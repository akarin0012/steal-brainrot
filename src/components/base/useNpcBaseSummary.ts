import { useMemo } from 'react';
import { useWorldStore } from '../../stores/worldStore.ts';
import { NPC_BASE_MAP } from '../../data/npcBases.ts';

export interface NpcBaseSummary {
  baseId: string;
  baseDef: ReturnType<typeof NPC_BASE_MAP.get> extends infer T ? Exclude<T, undefined> : never;
  npc: ReturnType<typeof useWorldStore.getState>['npcs'][number] | null;
  occupiedSlots: number;
  totalSlots: number;
}

export function useNpcBaseSummary(baseId: string): NpcBaseSummary | null {
  const npcs = useWorldStore(s => s.npcs);

  return useMemo(() => {
    const baseDef = NPC_BASE_MAP.get(baseId);
    if (!baseDef) return null;

    const npc = npcs.find(n => n.baseId === baseId) ?? null;
    const occupiedSlots = npc ? npc.buildingSlots.filter(s => s !== null).length : 0;
    const totalSlots = npc ? npc.buildingSlots.length : 8;

    return {
      baseId,
      baseDef,
      npc,
      occupiedSlots,
      totalSlots,
    };
  }, [baseId, npcs]);
}
