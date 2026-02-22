import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useWorldStore } from '../../stores/worldStore.ts';
import { NPC_BASE_MAP } from '../../data/npcBases.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function BaseInfoOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const data = useUIStore(s => s.overlayData);
  const npcs = useWorldStore(s => s.npcs);

  const baseId = data.baseId as string;
  const baseDef = NPC_BASE_MAP.get(baseId);
  const npc = npcs.find(n => n.baseId === baseId);

  if (!baseDef) return null;

  const occupiedSlots = npc ? npc.buildingSlots.filter(s => s !== null).length : 0;
  const totalSlots = npc ? npc.buildingSlots.length : 8;

  return (
    <Modal title={baseDef.name} onClose={closeOverlay}>
      <div className="text-center">
        <div className="bg-gray-800 rounded-lg p-4 mb-4 space-y-2">
          <div className="text-white">Difficulty: <span className="font-bold capitalize">{baseDef.difficulty}</span></div>
          <div className="text-gray-400 text-sm">Rarity Range: {baseDef.preferMinRarity} ~ {baseDef.preferMaxRarity}</div>
          <div className="text-gray-400 text-sm">Move Speed: {baseDef.moveSpeed} px/s</div>
          <div className="text-gray-400 text-sm">Steal Chance: {(baseDef.stealChance * 100).toFixed(1)}%</div>
          {npc && (
            <>
              <div className="text-gray-400 text-sm">NPC Currency: ${formatNumber(Math.floor(npc.currency))}</div>
              <div className="text-gray-400 text-sm">NPC Income: ${formatNumber(Math.floor(npc.incomePerSec))}/s</div>
              <div className="text-gray-400 text-sm">Slots: {occupiedSlots}/{totalSlots}</div>
              <div className="text-gray-400 text-sm">Status: <span className="capitalize">{npc.state.replaceAll('_', ' ')}</span></div>
            </>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Enter the building while the NPC is away to steal their Brainrots!
        </div>
      </div>
    </Modal>
  );
}
