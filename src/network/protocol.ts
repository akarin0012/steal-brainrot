import type { LeaderboardEntry, RemotePlayerState, SeasonEventSnapshot } from '../types/game.ts';

export interface ClientSnapshot {
  x: number;
  y: number;
  currency: number;
  assetValue: number;
  shieldUntil: number;
  stealSuccessCount: number;
}

export interface TradeOffer {
  currency: number;
  brainrotIds: string[];
}

export type C2SMessage =
  | { type: 'hello'; name: string }
  | { type: 'state'; payload: ClientSnapshot }
  | { type: 'steal_attempt'; targetId: string }
  | { type: 'trade_request'; targetId: string }
  | { type: 'trade_response'; fromId: string; accept: boolean }
  | { type: 'trade_offer'; tradeId: string; offer: TradeOffer }
  | { type: 'trade_confirm'; tradeId: string };

export type S2CMessage =
  | { type: 'welcome'; clientId: string }
  | { type: 'presence'; players: RemotePlayerState[] }
  | { type: 'leaderboard'; entries: LeaderboardEntry[] }
  | { type: 'steal_result'; ok: boolean; amount: number; reason?: string; targetId?: string }
  | { type: 'trade_request'; fromId: string; fromName: string }
  | { type: 'trade_started'; tradeId: string; peerId: string; peerName: string }
  | { type: 'trade_update'; tradeId: string; myOffer: TradeOffer; peerOffer: TradeOffer }
  | { type: 'trade_final'; tradeId: string; ok: boolean; reason?: string; deltaCurrency: number }
  | { type: 'season_event'; event: SeasonEventSnapshot | null };

