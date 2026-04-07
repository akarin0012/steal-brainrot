import { useMemo, useState } from 'react';
import Modal from '../common/Modal.tsx';
import { useUIStore } from '../../stores/uiStore.ts';
import { useOnlineStore } from '../../stores/onlineStore.ts';
import { useGameStore } from '../../stores/gameStore.ts';
import { formatNumber } from '../../utils/bigNumber.ts';

export default function TradeOverlay() {
  const closeOverlay = useUIStore(s => s.closeOverlay);
  const remotePlayers = useOnlineStore(s => s.remotePlayers);
  const incomingTrade = useOnlineStore(s => s.incomingTrade);
  const activeTrade = useOnlineStore(s => s.activeTrade);
  const connected = useOnlineStore(s => s.connected);
  const currency = useGameStore(s => s.currency);

  const requestTrade = useOnlineStore(s => s.requestTrade);
  const respondTradeRequest = useOnlineStore(s => s.respondTradeRequest);
  const setMyTradeOffer = useOnlineStore(s => s.setMyTradeOffer);
  const confirmTrade = useOnlineStore(s => s.confirmTrade);

  const [offerCurrency, setOfferCurrency] = useState(0);

  const canOffer = useMemo(() => offerCurrency >= 0 && offerCurrency <= currency, [offerCurrency, currency]);

  return (
    <Modal title="Trade Center" onClose={closeOverlay}>
      <div className="space-y-4">
        {!connected && (
          <div className="rounded border border-yellow-700 bg-yellow-950/40 px-3 py-2 text-sm text-yellow-200">
            Realtime server is offline.
          </div>
        )}

        {incomingTrade && !activeTrade && (
          <div className="rounded border border-blue-700 bg-blue-950/40 p-3 space-y-2">
            <div className="text-sm text-white">
              Trade request from <span className="font-bold">{incomingTrade.fromName}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => respondTradeRequest(true)}
                className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-xs font-bold text-white"
              >
                Accept
              </button>
              <button
                onClick={() => respondTradeRequest(false)}
                className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-xs font-bold text-white"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {!activeTrade && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-gray-400">Players</div>
            {remotePlayers.length === 0 && <div className="text-sm text-gray-500">No players online.</div>}
            {remotePlayers.map((p) => (
              <div key={p.id} className="rounded border border-gray-700 bg-gray-800 p-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{p.name}</div>
                  <div className="text-xs text-gray-400">${formatNumber(p.currency)}</div>
                </div>
                <button
                  onClick={() => requestTrade(p.id)}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                >
                  Request
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTrade && (
          <div className="space-y-3 rounded border border-purple-700 bg-purple-950/30 p-3">
            <div className="text-sm text-white">
              Trading with <span className="font-bold">{activeTrade.peerName}</span>
            </div>
            <div className="text-xs text-gray-300">
              Offer currency and confirm. (Brainrot list sync is reserved for next iteration.)
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-300">Your Offer</label>
              <input
                type="number"
                min={0}
                max={Math.floor(currency)}
                value={offerCurrency}
                onChange={(e) => setOfferCurrency(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className="w-36 px-2 py-1 rounded bg-gray-900 border border-gray-700 text-white text-sm"
              />
              <button
                onClick={() => {
                  if (!canOffer) return;
                  setMyTradeOffer(offerCurrency, []);
                }}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
              >
                Set Offer
              </button>
            </div>
            <div className="text-xs text-gray-300">
              My: ${formatNumber(activeTrade.myOffer.currency)} / Peer: ${formatNumber(activeTrade.peerOffer.currency)}
            </div>
            <button
              onClick={confirmTrade}
              className="w-full py-2 rounded bg-green-600 hover:bg-green-500 text-white text-sm font-bold"
            >
              Confirm Trade
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

