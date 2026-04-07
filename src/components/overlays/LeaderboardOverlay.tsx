import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useOnlineStore } from '../../stores/onlineStore.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function LeaderboardOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const entries = useOnlineStore(s => s.leaderboard);
  const connected = useOnlineStore(s => s.connected);

  return (
    <Modal title="Global Leaderboard" onClose={closeOverlay}>
      <div className="space-y-3">
        <div className="text-xs text-gray-400">
          {connected ? 'Connected to realtime server' : 'Offline: start server for realtime rankings'}
        </div>
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {entries.length === 0 && (
            <div className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400">
              No ranking data yet.
            </div>
          )}
          {entries.map((entry, index) => (
            <div key={entry.playerId} className="rounded border border-gray-700 bg-gray-800 px-3 py-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">
                  #{index + 1} {entry.name}
                </div>
                <div className="text-xs text-gray-400">Steals: {entry.stealSuccessCount}</div>
              </div>
              <div className="text-green-300 font-mono text-sm">${formatNumber(entry.totalValue)}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

