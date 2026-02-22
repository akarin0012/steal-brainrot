import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import { BRAINROT_MAP } from '../../data/brainrots.ts';
import { RARITIES } from '../../data/rarities.ts';
import { MUTATIONS } from '../../data/mutations.ts';
import { getMutationMultiplier } from '../../data/mutations.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function SlotOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const slotIndex = useUIStore(s => s.getTypedData<'slot_detail'>().slotIndex ?? 0);

  const owned = useGameStore(s => s.ownedBrainrots);
  const buildingSlots = useGameStore(s => s.buildingSlots);
  const assignSlot = useGameStore(s => s.assignSlot);
  const clearSlot = useGameStore(s => s.clearSlot);
  const recalcIncome = useGameStore(s => s.recalcIncome);

  const assignedInstanceId = buildingSlots[slotIndex] ?? null;
  const assignedOwned = assignedInstanceId
    ? owned.find(b => b.instanceId === assignedInstanceId)
    : null;
  const assignedDef = assignedOwned ? BRAINROT_MAP.get(assignedOwned.defId) : null;

  const otherOccupied = buildingSlots
    .map((instId, i) => ({ instId, slotIdx: i }))
    .filter(({ instId, slotIdx }) => instId !== null && slotIdx !== slotIndex);

  function handleSwap(otherSlotIdx: number) {
    const otherInstId = buildingSlots[otherSlotIdx];
    if (!otherInstId) return;

    if (assignedInstanceId) {
      assignSlot(slotIndex, otherInstId);
      assignSlot(otherSlotIdx, assignedInstanceId);
    } else {
      assignSlot(slotIndex, otherInstId);
      useGameStore.getState().clearSlot(otherSlotIdx);
    }
    recalcIncome();
  }

  function handleRemove() {
    clearSlot(slotIndex);
    recalcIncome();
  }

  return (
    <Modal title={`Slot ${slotIndex + 1}`} onClose={closeOverlay}>
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Currently Placed:</div>
        {assignedDef ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 bg-gray-800">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{ backgroundColor: `${assignedDef.color}30`, color: assignedDef.color }}
            >
              {assignedDef.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{assignedDef.name}</div>
              <div className="text-xs" style={{ color: assignedDef.color }}>
                {RARITIES[assignedDef.rarity].name}
                {assignedOwned?.mutation && (
                  <span style={{ color: MUTATIONS[assignedOwned.mutation].color }}>
                    {' '}[{MUTATIONS[assignedOwned.mutation].name}]
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {formatNumber(assignedDef.baseIncomePerSec * getMutationMultiplier(assignedOwned?.mutation))}/s
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors shrink-0"
            >
              Release
            </button>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4 border border-dashed border-gray-600 rounded-lg">
            Empty — pick up a Brainrot from the conveyor and bring it home!
          </div>
        )}
      </div>

      {otherOccupied.length > 0 && (
        <div>
          <div className="text-sm text-gray-400 mb-2">
            Swap with another slot:
          </div>
          <div className="grid grid-cols-4 gap-2">
            {otherOccupied.map(({ instId, slotIdx }) => {
              const o = owned.find(b => b.instanceId === instId);
              if (!o) return null;
              const def = BRAINROT_MAP.get(o.defId);
              if (!def) return null;
              const rarityDef = RARITIES[def.rarity];
              return (
                <button
                  key={slotIdx}
                  onClick={() => handleSwap(slotIdx)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-700 bg-gray-800 hover:ring-2 hover:ring-white/30 transition-all cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${def.color}30`, color: def.color }}
                  >
                    {def.name.charAt(0)}
                  </div>
                  <div className="text-[10px] text-gray-400">Slot {slotIdx + 1}</div>
                  <div className="text-[10px] font-bold text-white truncate max-w-full">{def.name}</div>
                  <div className="text-[9px]" style={{ color: rarityDef.color }}>{rarityDef.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
