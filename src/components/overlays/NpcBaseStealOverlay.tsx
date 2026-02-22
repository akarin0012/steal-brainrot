import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useWorldStore } from '../../stores/worldStore.ts';
import { NPC_BASE_MAP } from '../../data/npcBases.ts';
import { BRAINROT_MAP } from '../../data/brainrots.ts';
import { RARITIES } from '../../data/rarities.ts';
import { stealFromNPCSlot } from '../../systems/npcAI.ts';

export default function NpcBaseStealOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const data = useUIStore(s => s.overlayData);
  const npcs = useWorldStore(s => s.npcs);
  const setCarrying = useWorldStore(s => s.setCarrying);
  const carrying = useWorldStore(s => s.carryingBrainrot);

  const baseId = data.baseId as string;
  const npcId = data.npcId as string;
  const baseDef = NPC_BASE_MAP.get(baseId);
  const npc = npcs.find(n => n.id === npcId);

  if (!baseDef || !npc) return null;

  function handleSteal(slotIndex: number) {
    if (carrying) return;
    const defId = stealFromNPCSlot(npcId, slotIndex);
    if (defId) {
      setCarrying({ defId });
      closeOverlay();
    }
  }

  const occupiedCount = npc.buildingSlots.filter(s => s !== null).length;

  return (
    <Modal title={`${baseDef.name} - Steal`} onClose={closeOverlay}>
      <div className="space-y-3">
        <div className="text-gray-400 text-sm text-center">
          {occupiedCount === 0
            ? 'No brainrots to steal!'
            : carrying
              ? 'You are already carrying something!'
              : 'Click a slot to steal its Brainrot.'}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {npc.buildingSlots.map((defId, i) => {
            const def = defId ? BRAINROT_MAP.get(defId) : null;
            const rarity = def ? RARITIES[def.rarity] : null;

            return (
              <button
                key={i}
                onClick={() => handleSteal(i)}
                disabled={!def || !!carrying}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  def
                    ? 'border-gray-600 hover:border-red-500 bg-gray-800 cursor-pointer'
                    : 'border-gray-800 bg-gray-900 cursor-not-allowed opacity-40'
                }`}
              >
                {def && rarity ? (
                  <>
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: rarity.color }}
                    >
                      {def.name.charAt(0)}
                    </div>
                    <div className="text-xs text-white truncate">{def.name}</div>
                    <div className="text-xs" style={{ color: rarity.color }}>{rarity.name}</div>
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
