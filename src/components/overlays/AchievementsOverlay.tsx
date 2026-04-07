import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useOnlineStore } from '../../stores/onlineStore.ts';

export default function AchievementsOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const achievements = useOnlineStore(s => s.achievements);
  const recalc = useOnlineStore(s => s.recalcAchievements);

  return (
    <Modal title="Achievements" onClose={closeOverlay}>
      <div className="space-y-3">
        <button
          onClick={recalc}
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs font-bold text-white"
        >
          Refresh
        </button>
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`rounded border px-3 py-2 ${a.unlocked ? 'border-green-600 bg-green-950/30' : 'border-gray-700 bg-gray-800'}`}
            >
              <div className="text-sm font-bold text-white">{a.title}</div>
              <div className="text-xs text-gray-300">{a.description}</div>
              <div className={`text-xs mt-1 ${a.unlocked ? 'text-green-300' : 'text-gray-500'}`}>
                {a.unlocked ? 'Unlocked' : 'Locked'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

