import { useState } from 'react';
import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import { BRAINROT_MAP } from '../../data/brainrots.ts';
import { RARITIES } from '../../data/rarities.ts';
import { MUTATIONS } from '../../data/mutations.ts';
import { getMutationMultiplier } from '../../data/mutations.ts';
import { formatNumber } from '../../utils/bigNumber.ts';
import { getFusionInputCount, getFusionCost, performFusion } from '../../systems/fusion.ts';
import type { Mutation } from '../../types/game.ts';

export default function FusionOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);

  const owned = useGameStore(s => s.ownedBrainrots);
  const buildingSlots = useGameStore(s => s.buildingSlots);
  const recalcIncome = useGameStore(s => s.recalcIncome);
  const currency = useGameStore(s => s.currency);

  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<{ defId: string; mutation?: Mutation } | null>(null);

  const inputCount = getFusionInputCount();

  const slottedItems = buildingSlots.map((instId, slotIdx) => {
    if (!instId) return null;
    const o = owned.find(b => b.instanceId === instId);
    if (!o) return null;
    const def = BRAINROT_MAP.get(o.defId);
    if (!def) return null;
    return { slotIdx, instId, owned: o, def };
  }).filter(Boolean) as { slotIdx: number; instId: string; owned: typeof owned[0]; def: NonNullable<ReturnType<typeof BRAINROT_MAP.get>> }[];

  const selectedRarities = selected.map(si => {
    const item = slottedItems.find(s => s.slotIdx === si);
    return item?.def.rarity ?? 'common';
  });

  const cost = selectedRarities.length === inputCount ? getFusionCost(selectedRarities) : 0;
  const canFuse = selected.length === inputCount && currency >= cost && !result;

  function toggleSelect(slotIdx: number) {
    if (result) return;
    if (selected.includes(slotIdx)) {
      setSelected(selected.filter(s => s !== slotIdx));
    } else if (selected.length < inputCount) {
      setSelected([...selected, slotIdx]);
    }
  }

  function handleFuse() {
    if (!canFuse) return;
    const store = useGameStore.getState();
    if (!store.spendCurrency(cost)) return;

    const fusionResult = performFusion(selectedRarities);
    if (!fusionResult) return;

    for (const slotIdx of selected) {
      store.clearSlot(slotIdx);
    }

    const newOwned = {
      defId: fusionResult.defId,
      instanceId: `${fusionResult.defId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      acquiredAt: Date.now(),
      source: 'fusion' as const,
      mutation: fusionResult.mutation,
    };

    store.addBrainrot(newOwned);
    store.discoverBrainrot(fusionResult.defId);
    recalcIncome();
    setResult({ defId: fusionResult.defId, mutation: fusionResult.mutation });
    setSelected([]);
  }

  function handleClose() {
    setResult(null);
    setSelected([]);
    closeOverlay();
  }

  const resultDef = result ? BRAINROT_MAP.get(result.defId) : null;
  const resultRarity = resultDef ? RARITIES[resultDef.rarity] : null;
  const resultMutDef = result?.mutation ? MUTATIONS[result.mutation] : null;

  return (
    <Modal title="Fusion Machine" onClose={handleClose}>
      <div className="space-y-4">
        {result && resultDef && resultRarity ? (
          <div className="text-center space-y-3">
            <div className="text-lg font-bold text-purple-400">Fusion Complete!</div>
            <div className="inline-flex items-center gap-3 p-4 rounded-lg border-2 bg-gray-800"
              style={{ borderColor: resultRarity.color }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  backgroundColor: `${resultDef.color}30`,
                  color: resultDef.color,
                  border: resultMutDef ? `3px solid ${resultMutDef.color}` : undefined,
                }}>
                {resultDef.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-lg">{resultDef.name}</div>
                <div className="text-sm" style={{ color: resultRarity.color }}>
                  {resultRarity.name}
                  {resultMutDef && <span style={{ color: resultMutDef.color }}> [{resultMutDef.name}]</span>}
                </div>
                <div className="text-sm text-gray-400">
                  {formatNumber(resultDef.baseIncomePerSec * getMutationMultiplier(result.mutation))}/s
                </div>
              </div>
            </div>
            <button onClick={handleClose}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors">
              OK
            </button>
          </div>
        ) : (
          <>
            <div className="text-center text-sm text-gray-400">
              Select {inputCount} Brainrots from your slots to fuse into a new one.
              <br />Higher rarity inputs increase chances for better results.
            </div>

            <div className="grid grid-cols-4 gap-2">
              {slottedItems.map(({ slotIdx, owned: o, def }) => {
                const rarity = RARITIES[def.rarity];
                const isSelected = selected.includes(slotIdx);
                const mutInfo = o.mutation ? MUTATIONS[o.mutation] : null;
                return (
                  <button key={slotIdx} onClick={() => toggleSelect(slotIdx)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-500 bg-purple-900/30 ring-2 ring-purple-500/50'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                    }`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: `${def.color}30`,
                        color: def.color,
                        border: mutInfo ? `2px solid ${mutInfo.color}` : undefined,
                      }}>
                      {def.name.charAt(0)}
                    </div>
                    <div className="text-[10px] text-gray-500">Slot {slotIdx + 1}</div>
                    <div className="text-xs font-bold text-white truncate max-w-full">{def.name}</div>
                    <div className="text-[10px]" style={{ color: rarity.color }}>
                      {rarity.name}
                      {mutInfo && <span style={{ color: mutInfo.color }}> [{mutInfo.name[0]}]</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {slottedItems.length < inputCount && (
              <div className="text-center text-xs text-red-400">
                You need at least {inputCount} Brainrots in your slots to fuse.
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
              <div className="text-sm text-gray-400">
                Selected: <span className="text-white font-bold">{selected.length}/{inputCount}</span>
              </div>
              {cost > 0 && (
                <div className="text-sm text-gray-400">
                  Cost: <span className={currency >= cost ? 'text-green-400' : 'text-red-400'}>
                    ${formatNumber(cost)}
                  </span>
                </div>
              )}
            </div>

            <button onClick={handleFuse} disabled={!canFuse}
              className={`w-full py-2.5 text-white text-sm font-bold rounded-lg transition-colors ${
                canFuse
                  ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}>
              Fuse!
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
