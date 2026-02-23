import { useState, useEffect } from 'react';
import { getPityTimers } from '../../systems/eventScheduler.ts';
import { RARITIES } from '../../data/rarities.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import type { Rarity } from '../../types/game.ts';

const DISPLAY_RARITIES: Rarity[] = ['epic', 'legendary', 'mythic'];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PityTimerHUD() {
  const [timers, setTimers] = useState(getPityTimers);

  useEffect(() => {
    const id = setInterval(() => setTimers(getPityTimers()), 500);
    return () => clearInterval(id);
  }, []);

  const unlocked = useGameStore(s => s.getUnlockedRarities)();

  const visible = timers.filter(
    t => DISPLAY_RARITIES.includes(t.rarity) && unlocked.includes(t.rarity),
  );

  if (visible.length === 0) return null;

  return (
    <div className="absolute z-40 flex flex-col gap-1" style={{ right: 8, top: 432 }}>
      {visible.map(pt => {
        const remaining = Math.max(0, pt.intervalSec - pt.elapsedSec);
        const pct = Math.min((pt.elapsedSec / pt.intervalSec) * 100, 100);
        const rarityDef = RARITIES[pt.rarity];
        const imminent = remaining <= 30;

        return (
          <div
            key={pt.rarity}
            className="flex items-center gap-1.5 bg-black/70 rounded px-2 py-0.5"
          >
            <span
              className="text-[10px] font-bold w-[62px]"
              style={{ color: rarityDef.color }}
            >
              {rarityDef.name}
            </span>
            <div className="w-16 bg-gray-700/80 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${imminent ? 'animate-pulse' : ''}`}
                style={{
                  width: `${pct}%`,
                  backgroundColor: rarityDef.color,
                  transition: 'width 0.5s linear',
                }}
              />
            </div>
            <span className="text-[10px] text-gray-300 font-mono w-9 text-right">
              {formatTime(remaining)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
