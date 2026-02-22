import { useGameStore } from '../../stores/gameStore.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function ShieldStatus() {
  const shield = useGameStore(s => s.shield);
  const shieldCost = useGameStore(s => s.getShieldCost());

  if (!shield.active && shield.cooldownSec <= 0) return null;

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-40 bg-black/70 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-3">
      {shield.active ? (
        <>
          <span className="text-cyan-400">Shield: {Math.ceil(shield.remainingSec)}s</span>
          <span className="text-gray-500 text-xs">Extend: ${formatNumber(shieldCost)}</span>
        </>
      ) : (
        <span className="text-gray-400">Cooldown: {Math.ceil(shield.cooldownSec)}s</span>
      )}
    </div>
  );
}
