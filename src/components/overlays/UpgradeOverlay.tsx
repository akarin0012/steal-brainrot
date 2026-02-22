import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import { UPGRADES } from '../../data/upgrades.ts';
import { getUpgradeCost } from '../../systems/economy.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function UpgradeOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const currency = useGameStore(s => s.currency);
  const upgradeLevels = useGameStore(s => s.upgradeLevels);
  const upgradeItem = useGameStore(s => s.upgradeItem);

  function handleBuy(upgradeId: string) {
    upgradeItem(upgradeId);
  }

  return (
    <Modal title="Upgrade Shop" onClose={closeOverlay}>
      <div className="space-y-3">
        {UPGRADES.map(u => {
          const level = upgradeLevels[u.id] ?? 0;
          const maxed = level >= u.maxLevel;
          const cost = getUpgradeCost(u.id, u.baseCost, u.costMultiplier);
          const canAfford = currency >= cost;

          return (
            <div key={u.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
              <div>
                <div className="text-white font-bold text-sm">{u.name}</div>
                <div className="text-gray-400 text-xs">{u.description}</div>
                <div className="text-gray-500 text-xs">Level {level}/{u.maxLevel}</div>
              </div>
              <button
                onClick={() => handleBuy(u.id)}
                disabled={maxed || !canAfford}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded font-bold text-sm text-white transition-colors"
              >
                {maxed ? 'MAX' : formatNumber(cost)}
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
