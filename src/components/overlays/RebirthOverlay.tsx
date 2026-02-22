import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import { getNextRebirthInfo, performRebirth } from '../../systems/rebirth.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function RebirthOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const currency = useGameStore(s => s.currency);
  const rebirthLevel = useGameStore(s => s.rebirthLevel);
  const rebirthMultiplier = useGameStore(s => s.rebirthMultiplier);

  const nextInfo = getNextRebirthInfo();

  function handleRebirth() {
    if (performRebirth()) {
      closeOverlay();
    }
  }

  return (
    <Modal title="Rebirth Altar" onClose={closeOverlay}>
      <div className="text-center">
        <div className="text-purple-400 text-4xl font-bold mb-2">R{rebirthLevel}</div>
        <div className="text-gray-400 mb-6">Current Multiplier: {rebirthMultiplier}x</div>

        {nextInfo ? (
          <>
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="text-white font-bold">Next: R{nextInfo.level}</div>
              <div className="text-gray-400 text-sm">Requires: {formatNumber(nextInfo.cost)}</div>
              <div className="text-green-400 text-sm">New Multiplier: {nextInfo.multiplier}x</div>
              {nextInfo.level === 2 && <div className="text-yellow-400 text-xs mt-1">Unlocks: 2nd Floor</div>}
              {nextInfo.level === 5 && <div className="text-red-400 text-xs mt-1">Unlocks: Mythic Rarity</div>}
              {nextInfo.level === 10 && <div className="text-pink-400 text-xs mt-1">Unlocks: God Rarity + ??? Base</div>}
              {nextInfo.level === 15 && <div className="text-yellow-400 text-xs mt-1">Unlocks: 3rd Floor</div>}
            </div>

            <div className="text-xs text-red-400 mb-4">
              Warning: Rebirth resets currency, brainrots, and upgrades!
            </div>

            <button
              onClick={handleRebirth}
              disabled={currency < nextInfo.cost}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-bold text-white transition-colors"
            >
              {currency >= nextInfo.cost ? 'REBIRTH' : `Need ${formatNumber(nextInfo.cost - currency)} more`}
            </button>
          </>
        ) : (
          <div className="text-gray-500">Maximum rebirth reached!</div>
        )}
      </div>
    </Modal>
  );
}
