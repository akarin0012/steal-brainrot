import { useState } from 'react';
import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import { ALL_BRAINROTS } from '../../data/brainrots.ts';
import { RARITIES, RARITY_ORDER } from '../../data/rarities.ts';
import type { Rarity } from '../../types/game.ts';

export default function CollectionOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const collection = useGameStore(s => s.collection);
  const [filter, setFilter] = useState<Rarity | 'all'>('all');

  const filtered = filter === 'all'
    ? ALL_BRAINROTS
    : ALL_BRAINROTS.filter(b => b.rarity === filter);

  return (
    <Modal title="Collection Book" onClose={closeOverlay}>
      <div className="flex gap-1 mb-4 flex-wrap">
        <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="All" color="#fff" />
        {RARITY_ORDER.map(r => (
          <FilterBtn
            key={r}
            active={filter === r}
            onClick={() => setFilter(r)}
            label={RARITIES[r].name}
            color={RARITIES[r].color}
          />
        ))}
      </div>

      <div className="mb-3 text-xs text-gray-400">
        Discovered: {collection.filter(c => c.discovered).length}/{ALL_BRAINROTS.length}
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
        {filtered.map(def => {
          const entry = collection.find(c => c.brainrotId === def.id);
          const discovered = entry?.discovered ?? false;

          return (
            <div
              key={def.id}
              className="rounded border p-2 text-center text-xs"
              style={{
                borderColor: discovered ? def.color : '#374151',
                backgroundColor: discovered ? `${def.color}15` : '#1f2937',
              }}
            >
              {discovered ? (
                <>
                  <div className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${def.color}30`, color: def.color }}>
                    {def.name.charAt(0)}
                  </div>
                  <div className="text-white font-bold truncate">{def.name}</div>
                  <div style={{ color: def.color }}>{RARITIES[def.rarity].name}</div>
                  <div className="text-gray-500">x{entry?.timesObtained ?? 0}</div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full mx-auto mb-1 bg-gray-700 flex items-center justify-center text-gray-500 text-sm">?</div>
                  <div className="text-gray-600">???</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function FilterBtn({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-bold transition-colors ${active ? 'ring-2 ring-white' : ''}`}
      style={{ backgroundColor: active ? `${color}30` : '#374151', color }}
    >
      {label}
    </button>
  );
}
