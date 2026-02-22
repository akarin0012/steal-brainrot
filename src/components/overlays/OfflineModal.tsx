import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function OfflineModal() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const data = useUIStore(s => s.overlayData);

  const amount = (data.amount as number) ?? 0;
  const seconds = (data.seconds as number) ?? 0;

  return (
    <Modal title="Welcome Back!" onClose={closeOverlay}>
      <div className="text-center py-6">
        <div className="text-gray-400 mb-2">You were away for {Math.floor(seconds / 60)} minutes</div>
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
