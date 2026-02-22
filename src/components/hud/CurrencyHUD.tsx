import { useGameStore } from '../../stores/gameStore.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function CurrencyHUD() {
  const currency = useGameStore(s => s.currency);
  const income = useGameStore(s => s.incomePerSec);

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-black/80 rounded-b-lg px-6 py-2 text-white flex items-center gap-3 pointer-events-none">
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 text-lg">$</span>
        <span className="font-mono font-bold text-lg">{formatNumber(currency)}</span>
      </div>
      <div className="text-xs text-gray-400 font-mono">
        +{formatNumber(income)}/s
      </div>
    </div>
  );
}
