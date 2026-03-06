import { useState, useEffect, useRef } from 'react';
import { getLastPityConsumed, getPityTimers } from '../../systems/eventScheduler.ts';
import { RARITIES } from '../../data/rarities.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import type { Rarity } from '../../types/game.ts';

const DISPLAY_RARITIES: Rarity[] = ['rare', 'epic', 'legendary', 'mythic'];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PityTimerHUD() {
  const [timers, setTimers] = useState(getPityTimers);
  const [notice, setNotice] = useState<{ sequence: number; text: string; color: string } | null>(null);
  const lastSeenSeqRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTimers(getPityTimers());
      const consumed = getLastPityConsumed();
      if (!consumed || consumed.sequence <= lastSeenSeqRef.current) return;
      const rarityDef = RARITIES[consumed.rarity];
      setNotice({
        sequence: consumed.sequence,
        text: `${rarityDef.name} pity activated`,
        color: rarityDef.color,
      });
      lastSeenSeqRef.current = consumed.sequence;
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeoutId = setTimeout(() => {
      setNotice(prev => (prev?.sequence === notice.sequence ? null : prev));
    }, 2500);
    return () => clearTimeout(timeoutId);
  }, [notice]);

  const unlocked = useGameStore(s => s.getUnlockedRarities)();

  const visible = timers.filter(
    t => DISPLAY_RARITIES.includes(t.rarity) && unlocked.includes(t.rarity),
  );

  if (visible.length === 0) return null;

  return (
    <div className="absolute z-40 flex flex-col gap-1" style={{ right: 8, top: 432 }}>
      {visible.map(pt => {
        const pct = Math.min((pt.elapsedSec / pt.intervalSec) * 100, 100);
        const rarityDef = RARITIES[pt.rarity];
        const imminent = pt.remainingSec <= 30 && !pt.queued;
        const statusText = pt.queued ? 'READY' : formatTime(pt.remainingSec);

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
            <span className="text-[10px] text-gray-300 font-mono w-12 text-right">
              {statusText}
            </span>
            <span className={`text-[9px] font-bold w-8 text-right ${pt.queued ? 'text-green-300' : 'text-gray-500'}`}>
              {pt.queued ? 'PITY' : ''}
            </span>
          </div>
        );
      })}
      {notice && (
        <div className="self-end mt-1 bg-black/80 border border-white/10 rounded px-2 py-1">
          <span className="text-[10px] font-bold" style={{ color: notice.color }}>
            {notice.text}
          </span>
        </div>
      )}
    </div>
  );
}
