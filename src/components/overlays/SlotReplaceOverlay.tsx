import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import { useWorldStore } from '../../stores/worldStore.ts';
import { BRAINROT_MAP } from '../../data/brainrots.ts';
import { RARITIES } from '../../data/rarities.ts';
import { getMutationDef, getMutationMultiplier } from '../../data/mutations.ts';
import { formatNumber } from '../../utils/bigNumber.ts';
import type { OwnedBrainrot } from '../../types/game.ts';

export default function SlotReplaceOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const overlayData = useUIStore(s => s.getTypedData<'slot_replace'>());

  const owned = useGameStore(s => s.ownedBrainrots);
  const buildingSlots = useGameStore(s => s.buildingSlots);
  const recalcIncome = useGameStore(s => s.recalcIncome);

  const pendingDefId = overlayData.defId;
  const pendingMutation = overlayData.mutation;
  const pendingDef = pendingDefId ? BRAINROT_MAP.get(pendingDefId) : null;
  const pendingRarity = pendingDef ? RARITIES[pendingDef.rarity] : null;
  const pendingMutDef = getMutationDef(pendingMutation);

  if (!pendingDef || !pendingRarity) return null;

  function handleReplace(slotIndex: number) {
    if (!pendingDef) return;

    const store = useGameStore.getState();
    const world = useWorldStore.getState();
    const carrying = world.carryingBrainrot;
    if (!carrying) return;

    store.clearSlot(slotIndex);

    const newOwned: OwnedBrainrot = {
      defId: pendingDef.id,
      instanceId: `${pendingDef.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      acquiredAt: Date.now(),
      source: 'conveyor',
      mutation: pendingMutation,
    };

    store.addBrainrot(newOwned);
    store.discoverBrainrot(pendingDef.id);
    recalcIncome();
    world.setCarrying(null);
    closeOverlay();
  }

  function handleGiveUp() {
    useWorldStore.getState().setCarrying(null);
    closeOverlay();
  }

  function handleDismiss() {
    closeOverlay();
  }

  return (
    <Modal title="Replace a Brainrot" onClose={handleDismiss}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2">You want to place:</div>
          <div className="inline-flex items-center gap-3 p-3 rounded-lg border border-gray-700 bg-gray-800">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{ backgroundColor: `${pendingDef.color}30`, color: pendingDef.color }}
            >
              {pendingDef.name.charAt(0)}
            </div>
            <div className="text-left">
              <div className="font-bold text-white">{pendingDef.name}</div>
              <div className="text-xs" style={{ color: pendingRarity.color }}>
                {pendingRarity.name}
                {pendingMutDef && <span style={{ color: pendingMutDef.color }}> [{pendingMutDef.name}]</span>}
              </div>
              <div className="text-xs text-gray-400">
                {formatNumber(pendingDef.baseIncomePerSec * getMutationMultiplier(pendingMutation))}/s
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-400 text-center">
          All slots are full. Choose a slot to replace, or give up.
        </div>

        <div className="grid grid-cols-4 gap-2">
          {buildingSlots.map((instId, i) => {
            const o = instId ? owned.find(b => b.instanceId === instId) : null;
            const def = o ? BRAINROT_MAP.get(o.defId) : null;
            const rarity = def ? RARITIES[def.rarity] : null;

            return (
              <button
                key={i}
                onClick={() => handleReplace(i)}
                className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-gray-700 bg-gray-800 hover:border-red-500 transition-all cursor-pointer"
              >
                {def && rarity ? (() => {
                  const slotMut = o?.mutation;
                  const mutInfo = getMutationDef(slotMut);
                  return (
                    <>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: `${def.color}30`,
                          color: def.color,
                          border: mutInfo ? `2px solid ${mutInfo.color}` : undefined,
                        }}
                      >
                        {def.name.charAt(0)}
                      </div>
                      <div className="text-[10px] text-gray-500">Slot {i + 1}</div>
                      <div className="text-xs font-bold text-white truncate max-w-full">{def.name}</div>
                      <div className="text-[10px]" style={{ color: rarity.color }}>
                        {rarity.name}
                        {mutInfo && <span style={{ color: mutInfo.color }}> [{mutInfo.name}]</span>}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {formatNumber(def.baseIncomePerSec * getMutationMultiplier(slotMut))}/s
                      </div>
                    </>
                  );
                })() : (
                  <div className="text-gray-600 text-xs py-5">Empty</div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleGiveUp}
          className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Give Up (Discard)
        </button>
      </div>
    </Modal>
  );
}
