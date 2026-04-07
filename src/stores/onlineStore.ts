import { create } from 'zustand';
import { networkClient } from '../network/client.ts';
import type { ClientSnapshot, TradeOffer } from '../network/protocol.ts';
import { useGameStore } from './gameStore.ts';
import { useWorldStore } from './worldStore.ts';
import { useUIStore } from './uiStore.ts';
import type { AchievementDef, LeaderboardEntry, RemotePlayerState, SeasonEventSnapshot } from '../types/game.ts';
import { setRemoteLiveEventOverride } from '../systems/eventScheduler.ts';

interface IncomingTradeRequest {
  fromId: string;
  fromName: string;
}

interface ActiveTrade {
  tradeId: string;
  peerId: string;
  peerName: string;
  myOffer: TradeOffer;
  peerOffer: TradeOffer;
}

interface OnlineState {
  initialized: boolean;
  connected: boolean;
  clientId: string | null;
  playerName: string;
  remotePlayers: RemotePlayerState[];
  leaderboard: LeaderboardEntry[];
  stealSuccessCount: number;
  incomingTrade: IncomingTradeRequest | null;
  activeTrade: ActiveTrade | null;
  seasonEvent: SeasonEventSnapshot | null;
  achievements: Array<AchievementDef & { unlocked: boolean }>;

  initConnection: () => void;
  syncState: () => void;
  tryStealNearbyPlayer: () => boolean;
  requestTrade: (targetId: string) => void;
  respondTradeRequest: (accept: boolean) => void;
  setMyTradeOffer: (currency: number, brainrotIds: string[]) => void;
  confirmTrade: () => void;
  recalcAchievements: () => void;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_100k', title: 'First 100K', description: 'Reach total value of 100,000' },
  { id: 'rebirth_5', title: 'R5 Milestone', description: 'Reach rebirth level 5' },
  { id: 'thief_10', title: 'Skilled Thief', description: 'Complete 10 successful PvP steals' },
];

function estimateAssetValue(): number {
  const game = useGameStore.getState();
  return Math.max(0, game.currency + game.incomePerSec * 45);
}

function getNearbyPlayer(players: RemotePlayerState[], x: number, y: number): RemotePlayerState | null {
  let best: RemotePlayerState | null = null;
  let bestDist = 64;
  for (const p of players) {
    const dx = p.x - x;
    const dy = p.y - y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export const useOnlineStore = create<OnlineState>((set, get) => ({
  initialized: false,
  connected: false,
  clientId: null,
  playerName: `Player-${Math.floor(Math.random() * 900 + 100)}`,
  remotePlayers: [],
  leaderboard: [],
  stealSuccessCount: 0,
  incomingTrade: null,
  activeTrade: null,
  seasonEvent: null,
  achievements: ACHIEVEMENTS.map(def => ({ ...def, unlocked: false })),

  initConnection: () => {
    if (get().initialized) return;
    set({ initialized: true });
    const host = (import.meta.env.VITE_NET_HOST as string | undefined) ?? 'localhost';
    const port = (import.meta.env.VITE_NET_PORT as string | undefined) ?? '8080';
    const url = `ws://${host}:${port}`;
    const name = get().playerName;
    networkClient.connect(url, name);

    networkClient.onStatus((connected) => set({ connected }));
    networkClient.onMessage((msg) => {
      switch (msg.type) {
        case 'welcome':
          set({ clientId: msg.clientId });
          break;
        case 'presence': {
          const ownId = get().clientId;
          set({
            remotePlayers: msg.players.filter(p => p.id !== ownId),
          });
          break;
        }
        case 'leaderboard':
          set({ leaderboard: msg.entries });
          break;
        case 'steal_result':
          if (msg.ok && msg.amount > 0) {
            useGameStore.getState().addCurrency(msg.amount);
            set(s => ({ stealSuccessCount: s.stealSuccessCount + 1 }));
            get().recalcAchievements();
          }
          break;
        case 'trade_request':
          set({ incomingTrade: { fromId: msg.fromId, fromName: msg.fromName } });
          useUIStore.getState().openOverlay('trade');
          break;
        case 'trade_started':
          set({
            incomingTrade: null,
            activeTrade: {
              tradeId: msg.tradeId,
              peerId: msg.peerId,
              peerName: msg.peerName,
              myOffer: { currency: 0, brainrotIds: [] },
              peerOffer: { currency: 0, brainrotIds: [] },
            },
          });
          useUIStore.getState().openOverlay('trade');
          break;
        case 'trade_update':
          set((s) => {
            if (!s.activeTrade || s.activeTrade.tradeId !== msg.tradeId) return {};
            return {
              activeTrade: {
                ...s.activeTrade,
                myOffer: msg.myOffer,
                peerOffer: msg.peerOffer,
              },
            };
          });
          break;
        case 'trade_final':
          if (msg.ok && msg.deltaCurrency !== 0) {
            if (msg.deltaCurrency > 0) useGameStore.getState().addCurrency(msg.deltaCurrency);
            if (msg.deltaCurrency < 0) useGameStore.getState().spendCurrency(-msg.deltaCurrency);
          }
          set({ activeTrade: null, incomingTrade: null });
          break;
        case 'season_event':
          set({ seasonEvent: msg.event });
          setRemoteLiveEventOverride(msg.event);
          break;
        default:
          break;
      }
    });
  },

  syncState: () => {
    if (!get().connected) return;
    const game = useGameStore.getState();
    const world = useWorldStore.getState();
    const payload: ClientSnapshot = {
      x: world.playerX,
      y: world.playerY,
      currency: game.currency,
      assetValue: estimateAssetValue(),
      shieldUntil: game.shield.active ? Date.now() + game.shield.remainingSec * 1000 : 0,
      stealSuccessCount: get().stealSuccessCount,
    };
    networkClient.send({ type: 'state', payload });
  },

  tryStealNearbyPlayer: () => {
    const world = useWorldStore.getState();
    const target = getNearbyPlayer(get().remotePlayers, world.playerX, world.playerY);
    if (!target) return false;
    networkClient.send({ type: 'steal_attempt', targetId: target.id });
    return true;
  },

  requestTrade: (targetId) => {
    networkClient.send({ type: 'trade_request', targetId });
  },

  respondTradeRequest: (accept) => {
    const incoming = get().incomingTrade;
    if (!incoming) return;
    networkClient.send({ type: 'trade_response', fromId: incoming.fromId, accept });
    if (!accept) set({ incomingTrade: null });
  },

  setMyTradeOffer: (currency, brainrotIds) => {
    const active = get().activeTrade;
    if (!active) return;
    const cleanCurrency = Math.max(0, Math.floor(currency));
    const offer: TradeOffer = { currency: cleanCurrency, brainrotIds };
    networkClient.send({ type: 'trade_offer', tradeId: active.tradeId, offer });
  },

  confirmTrade: () => {
    const active = get().activeTrade;
    if (!active) return;
    networkClient.send({ type: 'trade_confirm', tradeId: active.tradeId });
  },

  recalcAchievements: () => {
    const game = useGameStore.getState();
    const steals = get().stealSuccessCount;
    const totalValue = estimateAssetValue();
    set({
      achievements: ACHIEVEMENTS.map(def => {
        let unlocked = false;
        if (def.id === 'first_100k') unlocked = totalValue >= 100_000;
        if (def.id === 'rebirth_5') unlocked = game.rebirthLevel >= 5;
        if (def.id === 'thief_10') unlocked = steals >= 10;
        return { ...def, unlocked };
      }),
    });
  },
}));

