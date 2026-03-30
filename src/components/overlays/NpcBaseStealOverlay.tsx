import { useEffect, useRef } from 'react';
import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useWorldStore } from '../../stores/worldStore.ts';
import { BRAINROT_MAP } from '../../data/brainrots.ts';
import { RARITIES } from '../../data/rarities.ts';
import { getMutationDef } from '../../data/mutations.ts';
import { stealFromNPCSlot, isNPCHome } from '../../systems/npcAI.ts';
import BaseSummaryCard from '../base/BaseSummaryCard.tsx';
import { useNpcBaseSummary } from '../base/useNpcBaseSummary.ts';

const STEAL_TIMEOUT_MS = 10_000;

export default function NpcBaseStealOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const data = useUIStore(s => s.getTypedData<'npc_base_steal'>());
  const npcs = useWorldStore(s => s.npcs);
  const setCarrying = useWorldStore(s => s.setCarrying);
  const carrying = useWorldStore(s => s.carryingBrainrot);
  const closedRef = useRef(false);

  const baseId = data.baseId;
  const npcId = data.npcId;
  const targetSlot = data.slotIndex;
  const summary = useNpcBaseSummary(baseId);
  const npc = npcs.find(n => n.id === npcId);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!closedRef.current) { closedRef.current = true; closeOverlay(); }
    }, STEAL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (npcId && isNPCHome(npcId) && !closedRef.current) {
      closedRef.current = true;
      closeOverlay();
    }
  }, [npcId, npcs, closeOverlay]);

  if (!summary || !npc) return null;

  function handleSteal(slotIndex: number) {
    if (carrying) return;
    const result = stealFromNPCSlot(npcId, slotIndex);
    if (result) {
      setCarrying({ defId: result.defId, mutation: result.mutation, source: 'steal' });
      closeOverlay();
    }
  }

  const occupiedCount = npc.buildingSlots.filter(s => s !== null).length;

  return (
    <Modal title={`${summary.baseDef.name} - Steal`} onClose={closeOverlay}>
      <div className="space-y-3">
        <BaseSummaryCard
          baseDef={summary.baseDef}
          npc={summary.npc}
          occupiedSlots={summary.occupiedSlots}
          totalSlots={summary.totalSlots}
          className="bg-gray-800 rounded-lg p-3"
        />
        <div className="text-gray-400 text-sm text-center">
          {occupiedCount === 0
            ? 'No brainrots to steal!'
            : carrying
              ? 'You are already carrying something!'
              : 'Choose a slot to steal.'}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {npc.buildingSlots.map((slot, i) => {
            const def = slot ? BRAINROT_MAP.get(slot.defId) : null;
            const rarity = def ? RARITIES[def.rarity] : null;
            const mutInfo = getMutationDef(slot?.mutation);
            const isTarget = i === targetSlot;
            const canSteal = !!def && !carrying;

            return (
              <button
                key={i}
                onClick={() => handleSteal(i)}
                disabled={!canSteal}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  canSteal
                    ? isTarget
                      ? 'border-red-500 bg-gray-800 cursor-pointer hover:bg-gray-700 ring-2 ring-red-400/50'
                      : 'border-gray-600 hover:border-red-500 bg-gray-800 cursor-pointer'
                    : 'border-gray-800 bg-gray-900 cursor-not-allowed opacity-30'
                }`}
              >
                {def && rarity ? (
                  <>
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: rarity.color,
                        border: mutInfo ? `2px solid ${mutInfo.color}` : undefined,
                      }}
                    >
                      {def.name.charAt(0)}
                    </div>
                    <div className="text-xs text-white truncate">{def.name}</div>
                    <div className="text-xs" style={{ color: rarity.color }}>
                      {rarity.name}
                      {mutInfo && <span style={{ color: mutInfo.color }}> [{mutInfo.name[0]}]</span>}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-600 text-xs py-3">Empty</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
