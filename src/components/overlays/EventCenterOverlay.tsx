import { useEffect, useState } from 'react';
import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import {
  claimActiveLiveEventReward,
  getActiveLiveEvent,
  getActiveLiveEventSpawnPoolIds,
  getLiveEventDefinitions,
  getLiveEventEffectSummary,
  getLiveEventUntilNextSec,
} from '../../systems/eventScheduler.ts';
import { formatNumber } from '../../utils/bigNumber.ts';
import { BRAINROT_MAP } from '../../data/brainrots.ts';

function formatTime(sec: number): string {
  const t = Math.max(0, Math.floor(sec));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function EventCenterOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const [active, setActive] = useState(getActiveLiveEvent());
  const [untilNext, setUntilNext] = useState(getLiveEventUntilNextSec());
  const [activeSpawnPoolIds, setActiveSpawnPoolIds] = useState<string[]>(getActiveLiveEventSpawnPoolIds());
  const [toast, setToast] = useState<string | null>(null);
  const defs = getLiveEventDefinitions();

  useEffect(() => {
    const id = setInterval(() => {
      setActive(getActiveLiveEvent());
      setUntilNext(getLiveEventUntilNextSec());
      setActiveSpawnPoolIds(getActiveLiveEventSpawnPoolIds());
    }, 250);
    return () => clearInterval(id);
  }, []);

  function claimReward() {
    const result = claimActiveLiveEventReward();
    if (!result.ok) {
      setToast(result.reason ?? 'Claim failed');
      return;
    }
    setToast(`Claimed $${formatNumber(result.amount)}`);
  }

  return (
    <Modal title="Event Center" onClose={closeOverlay}>
      <div className="space-y-4">
        {active ? (
          <div className="rounded-lg border border-green-600 bg-green-950/40 p-3 space-y-1">
            <div className="text-sm font-bold text-green-300">Active: {active.name}</div>
            <div className="text-xs text-gray-200">{active.description}</div>
            <div className="text-xs text-gray-300">
              Effects: <span className="text-green-300 font-bold">{getLiveEventEffectSummary(active).join(', ') || 'none'}</span>
            </div>
            <div className="text-xs text-gray-300">
              Time left: <span className="font-mono text-white">{formatTime(active.remainingSec)}</span>
            </div>
            {activeSpawnPoolIds.length > 0 && (
              <div className="text-xs text-gray-200">
                Event spawns: {activeSpawnPoolIds.map(id => BRAINROT_MAP.get(id)?.name ?? id).join(', ')}
              </div>
            )}
            <button
              onClick={claimReward}
              className="w-full mt-2 py-2 rounded bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors"
            >
              Claim Event Reward
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-3">
            <div className="text-sm font-bold text-gray-200">No active event</div>
            <div className="text-xs text-gray-400 mt-1">
              Next event starts in <span className="font-mono text-white">{formatTime(untilNext)}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-gray-400">Scheduled Events</div>
          {defs.map(ev => (
            <div key={ev.id} className="rounded border border-gray-700 bg-gray-900/70 px-3 py-2">
              <div className="text-sm font-bold text-white">{ev.name}</div>
              <div className="text-xs text-gray-400">{ev.description}</div>
              <div className="text-[11px] text-gray-500 mt-1">
                every {formatTime(ev.intervalSec)}, lasts {formatTime(ev.durationSec)}, {getLiveEventEffectSummary(ev).join(', ') || 'no effect'}
              </div>
            </div>
          ))}
        </div>

        {toast && <div className="text-xs text-blue-300">{toast}</div>}
      </div>
    </Modal>
  );
}
