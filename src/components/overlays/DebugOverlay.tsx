import { useState, useEffect } from 'react';
import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import { useWorldStore } from '../../stores/worldStore.ts';
import { NPC_BASES } from '../../data/npcBases.ts';
import { RARITIES } from '../../data/rarities.ts';
import { formatNumber } from '../../utils/bigNumber.ts';
import { getPityTimers } from '../../systems/eventScheduler.ts';

export default function DebugOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const playerCurrency = useGameStore(s => s.currency);
  const npcs = useWorldStore(s => s.npcs);
  const updateNPC = useWorldStore(s => s.updateNPC);

  const [playerInput, setPlayerInput] = useState(String(playerCurrency));
  const [npcInputs, setNpcInputs] = useState<Record<string, string>>({});
  const [confirmReset, setConfirmReset] = useState(false);
  const [pitySnapshot, setPitySnapshot] = useState(getPityTimers);

  useEffect(() => {
    const id = setInterval(() => setPitySnapshot(getPityTimers()), 500);
    return () => clearInterval(id);
  }, []);

  function applyPlayerCurrency() {
    const val = Number(playerInput);
    if (!Number.isFinite(val) || val < 0) return;
    useGameStore.setState({ currency: val });
  }

  function applyNpcCurrency(npcId: string) {
    const val = Number(npcInputs[npcId] ?? '');
    if (!Number.isFinite(val) || val < 0) return;
    updateNPC(npcId, { currency: val });
  }

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    localStorage.clear();
    location.reload();
  }

  return (
    <Modal title="Debug Menu" onClose={closeOverlay}>
      <div className="space-y-5">
        {/* Player Currency */}
        <section>
          <h3 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-wide">Player Currency</h3>
          <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
            <span className="text-gray-400 text-sm">Current:</span>
            <span className="text-yellow-300 font-bold text-sm">${formatNumber(playerCurrency)}</span>
            <input
              type="number"
              min={0}
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm outline-none focus:border-blue-500"
            />
            <button
              onClick={applyPlayerCurrency}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
            >
              Set
            </button>
          </div>
        </section>

        {/* NPC Currency */}
        <section>
          <h3 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-wide">NPC Currency</h3>
          <div className="space-y-2">
            {npcs.map(npc => {
              const base = NPC_BASES.find(b => b.id === npc.baseId);
              const inputVal = npcInputs[npc.id] ?? '';
              return (
                <div key={npc.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                  <span
                    className="text-sm font-bold w-28 truncate"
                    style={{ color: base?.color ?? '#fff' }}
                  >
                    {base?.name ?? npc.id}
                  </span>
                  <span className="text-yellow-300 font-bold text-sm w-24 text-right">
                    ${formatNumber(npc.currency)}
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder={String(Math.floor(npc.currency))}
                    value={inputVal}
                    onChange={e => setNpcInputs(prev => ({ ...prev, [npc.id]: e.target.value }))}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => applyNpcCurrency(npc.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
                  >
                    Set
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pity Timers */}
        <section>
          <h3 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-wide">Pity Timers</h3>
          <div className="space-y-1">
            {pitySnapshot.map(pt => {
              const remaining = Math.max(0, pt.intervalSec - pt.elapsedSec);
              const pct = (pt.elapsedSec / pt.intervalSec) * 100;
              const rarityDef = RARITIES[pt.rarity];
              return (
                <div key={pt.rarity} className="bg-gray-800 rounded-lg p-2 flex items-center gap-3">
                  <span className="text-xs font-bold w-20" style={{ color: rarityDef.color }}>
                    {rarityDef.name}
                  </span>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: rarityDef.color }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 w-16 text-right font-mono">
                    {Math.floor(remaining)}s / {pt.intervalSec}s
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Data Reset */}
        <section>
          <h3 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-wide">Data Reset</h3>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-3">
              All save data (player progress, NPC state, upgrades) will be permanently deleted.
            </p>
            <button
              onClick={handleReset}
              className={`${confirmReset
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-gray-600 hover:bg-gray-500'
              } text-white text-sm font-bold px-4 py-2 rounded transition-colors w-full`}
            >
              {confirmReset ? 'Click again to confirm reset' : 'Reset All Data'}
            </button>
          </div>
        </section>
      </div>
    </Modal>
  );
}
