import { useMemo } from 'react';
import { useGearStore } from '../../stores/gearStore.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import { ALL_GEARS } from '../../data/gears.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function GearHUD() {
  const rebirthLevel = useGameStore(s => s.rebirthLevel);
  const currency = useGameStore(s => s.currency);
  const cooldowns = useGearStore(s => s.cooldowns);
  const activeEffects = useGearStore(s => s.activeEffects);
  const gears = useMemo(() => ALL_GEARS.filter(g => g.rebirthRequired <= rebirthLevel), [rebirthLevel]);

  if (gears.length === 0) return null;

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
      {gears.map((gear, i) => {
        const cd = cooldowns[gear.id] ?? 0;
        const isActive = activeEffects.some(e => e.gearId === gear.id);
        const activeEffect = activeEffects.find(e => e.gearId === gear.id);
        const canAfford = currency >= gear.cost;
        const isReady = cd <= 0 && canAfford;

        return (
          <div key={gear.id}
            className={`relative flex flex-col items-center px-2 py-1 rounded-lg text-[10px] min-w-[52px] transition-all ${
              isActive
                ? 'bg-purple-800/90 border border-purple-400 shadow-lg shadow-purple-500/30'
                : isReady
                  ? 'bg-gray-800/90 border border-gray-600 hover:border-gray-400'
                  : 'bg-gray-900/90 border border-gray-700 opacity-60'
            }`}
            title={`${gear.name}: ${gear.description}\nCost: $${formatNumber(gear.cost)}\nPress ${i + 1} to use`}
          >
            <div className="text-gray-500 font-mono">[{i + 1}]</div>
            <div className={`font-bold truncate max-w-[48px] ${isActive ? 'text-purple-200' : 'text-white'}`}>
              {gear.name.split(' ')[0]}
            </div>
            {isActive && activeEffect ? (
              <div className="text-purple-300">{Math.ceil(activeEffect.remainingSec)}s</div>
            ) : cd > 0 ? (
              <div className="text-red-400">{Math.ceil(cd)}s</div>
            ) : (
              <div className="text-gray-500">${formatNumber(gear.cost)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
