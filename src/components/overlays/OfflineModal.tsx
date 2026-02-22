import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function OfflineModal() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const data = useUIStore(s => s.getTypedData<'offline_income'>());

  const amount = data.amount ?? 0;
  const seconds = data.seconds ?? 0;

  return (
    <Modal title="Welcome Back!" onClose={closeOverlay}>
      <div className="text-center py-6">
        <div className="text-gray-400 mb-2">You were away for {
          seconds >= 3600
            ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
            : seconds >= 60
              ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
              : `${seconds}s`
        }</div>
        <div className="text-2xl font-bold text-yellow-400 mb-4">
          +{formatNumber(amount)} coins
        </div>
        <button
          onClick={closeOverlay}
          className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-white"
        >
          Collect!
        </button>
      </div>
    </Modal>
  );
}
