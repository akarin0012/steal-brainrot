import { useState } from 'react';
import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { redeemCode } from '../../systems/redeem.ts';

export default function RedeemOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function submit() {
    const result = redeemCode(code);
    setOk(result.ok);
    setMessage(result.message);
  }

  return (
    <Modal title="Redeem Codes" onClose={closeOverlay}>
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          Enter an active reward code. Codes are case-insensitive.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="EXAMPLECODE"
          className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white text-sm outline-none focus:border-blue-500"
        />
        <button
          onClick={submit}
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
        >
          Redeem
        </button>
        {message && (
          <div className={`text-xs ${ok ? 'text-green-300' : 'text-red-300'}`}>
            {message}
          </div>
        )}
      </div>
    </Modal>
  );
}
