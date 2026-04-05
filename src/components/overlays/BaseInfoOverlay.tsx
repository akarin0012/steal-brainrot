import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import BaseSummaryCard from '../base/BaseSummaryCard.tsx';
import { useNpcBaseSummary } from '../base/useNpcBaseSummary.ts';

export default function BaseInfoOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const data = useUIStore(s => s.getTypedData<'base_info'>());
  const summary = useNpcBaseSummary(data.baseId);
  if (!summary) return null;

  return (
    <Modal title={summary.baseDef.name} onClose={closeOverlay}>
      <div className="text-center">
        <BaseSummaryCard
          baseDef={summary.baseDef}
          npc={summary.npc}
          occupiedSlots={summary.occupiedSlots}
          totalSlots={summary.totalSlots}
          className="bg-gray-800 rounded-lg p-4 mb-4"
        />
        <div className="text-xs text-gray-500">
          Enter the building while the NPC is away to steal their Brainrots!
        </div>
      </div>
    </Modal>
  );
}
