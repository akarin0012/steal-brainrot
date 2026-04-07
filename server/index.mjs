import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 8080);
const wss = new WebSocketServer({ port: PORT });

const players = new Map();
const trades = new Map();

let seasonEvent = null;
let seasonEndsAt = 0;

function id() {
  return Math.random().toString(36).slice(2, 10);
}

function send(ws, data) {
  if (ws.readyState !== 1) return;
  ws.send(JSON.stringify(data));
}

function broadcast(data) {
  for (const p of players.values()) {
    send(p.ws, data);
  }
}

function publishPresenceAndLeaderboard() {
  const all = [...players.values()].map(p => ({
    id: p.id,
    name: p.name,
    x: p.state.x,
    y: p.state.y,
    currency: p.state.currency,
    assetValue: p.state.assetValue,
    shieldUntil: p.state.shieldUntil,
    stealSuccessCount: p.state.stealSuccessCount ?? 0,
  }));
  const leaderboard = [...players.values()]
    .map(p => ({
      playerId: p.id,
      name: p.name,
      totalValue: Math.max(0, p.state.assetValue),
      stealSuccessCount: p.state.stealSuccessCount ?? 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 20);
  broadcast({ type: 'presence', players: all });
  broadcast({ type: 'leaderboard', entries: leaderboard });
}

function setRandomSeasonEvent() {
  if (seasonEvent && Date.now() < seasonEndsAt) return;
  const options = [
    null,
    { id: 'sv_income_rush', name: 'Server Rush', incomeMultiplier: 1.5, spawnPoolIds: [], remainingSec: 90 },
    { id: 'sv_golden_wave', name: 'Golden Wave', incomeMultiplier: 1.25, spawnPoolIds: ['l04', 'm02'], remainingSec: 90 },
  ];
  seasonEvent = options[Math.floor(Math.random() * options.length)];
  if (seasonEvent) {
    seasonEndsAt = Date.now() + seasonEvent.remainingSec * 1000;
  } else {
    seasonEndsAt = 0;
  }
  broadcast({ type: 'season_event', event: seasonEvent });
}

function getPlayer(idValue) {
  if (!idValue) return null;
  return players.get(idValue) ?? null;
}

wss.on('connection', (ws) => {
  const player = {
    id: id(),
    ws,
    name: 'Player',
    state: { x: 0, y: 0, currency: 0, assetValue: 0, shieldUntil: 0, stealSuccessCount: 0 },
    pendingTrade: null,
  };
  players.set(player.id, player);
  send(ws, { type: 'welcome', clientId: player.id });
  send(ws, { type: 'season_event', event: seasonEvent });
  publishPresenceAndLeaderboard();

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'hello' && typeof msg.name === 'string') {
      player.name = msg.name.slice(0, 24);
      publishPresenceAndLeaderboard();
      return;
    }

    if (msg.type === 'state' && msg.payload) {
      const p = msg.payload;
      player.state = {
        x: Number(p.x) || 0,
        y: Number(p.y) || 0,
        currency: Math.max(0, Number(p.currency) || 0),
        assetValue: Math.max(0, Number(p.assetValue) || 0),
        shieldUntil: Math.max(0, Number(p.shieldUntil) || 0),
        stealSuccessCount: Math.max(0, Number(p.stealSuccessCount) || 0),
      };
      return;
    }

    if (msg.type === 'steal_attempt') {
      const target = getPlayer(msg.targetId);
      if (!target || target.id === player.id) {
        send(ws, { type: 'steal_result', ok: false, amount: 0, reason: 'Target unavailable' });
        return;
      }
      if ((target.state.shieldUntil || 0) > Date.now()) {
        send(ws, { type: 'steal_result', ok: false, amount: 0, reason: 'Target shielded', targetId: target.id });
        return;
      }
      const amount = Math.max(25, Math.floor((target.state.currency || 0) * 0.05));
      target.state.currency = Math.max(0, target.state.currency - amount);
      player.state.currency += amount;
      player.state.stealSuccessCount = (player.state.stealSuccessCount || 0) + 1;
      send(ws, { type: 'steal_result', ok: true, amount, targetId: target.id });
      publishPresenceAndLeaderboard();
      return;
    }

    if (msg.type === 'trade_request') {
      const target = getPlayer(msg.targetId);
      if (!target || target.id === player.id) return;
      target.pendingTrade = { fromId: player.id };
      send(target.ws, { type: 'trade_request', fromId: player.id, fromName: player.name });
      return;
    }

    if (msg.type === 'trade_response') {
      const from = getPlayer(msg.fromId);
      if (!from) return;
      if (!msg.accept) {
        send(from.ws, { type: 'trade_final', tradeId: 'none', ok: false, reason: 'Declined', deltaCurrency: 0 });
        return;
      }
      const tradeId = id();
      const trade = {
        id: tradeId,
        aId: from.id,
        bId: player.id,
        aOffer: { currency: 0, brainrotIds: [] },
        bOffer: { currency: 0, brainrotIds: [] },
        aConfirmed: false,
        bConfirmed: false,
      };
      trades.set(tradeId, trade);
      send(from.ws, { type: 'trade_started', tradeId, peerId: player.id, peerName: player.name });
      send(player.ws, { type: 'trade_started', tradeId, peerId: from.id, peerName: from.name });
      return;
    }

    if (msg.type === 'trade_offer') {
      const trade = trades.get(msg.tradeId);
      if (!trade) return;
      const isA = trade.aId === player.id;
      const isB = trade.bId === player.id;
      if (!isA && !isB) return;
      const nextOffer = {
        currency: Math.max(0, Math.floor(Number(msg.offer?.currency) || 0)),
        brainrotIds: Array.isArray(msg.offer?.brainrotIds) ? msg.offer.brainrotIds.filter(v => typeof v === 'string').slice(0, 6) : [],
      };
      if (isA) trade.aOffer = nextOffer;
      if (isB) trade.bOffer = nextOffer;
      trade.aConfirmed = false;
      trade.bConfirmed = false;
      const a = getPlayer(trade.aId);
      const b = getPlayer(trade.bId);
      if (!a || !b) return;
      send(a.ws, { type: 'trade_update', tradeId: trade.id, myOffer: trade.aOffer, peerOffer: trade.bOffer });
      send(b.ws, { type: 'trade_update', tradeId: trade.id, myOffer: trade.bOffer, peerOffer: trade.aOffer });
      return;
    }

    if (msg.type === 'trade_confirm') {
      const trade = trades.get(msg.tradeId);
      if (!trade) return;
      if (trade.aId === player.id) trade.aConfirmed = true;
      if (trade.bId === player.id) trade.bConfirmed = true;
      if (!trade.aConfirmed || !trade.bConfirmed) return;
      const a = getPlayer(trade.aId);
      const b = getPlayer(trade.bId);
      if (!a || !b) return;
      if (a.state.currency < trade.aOffer.currency || b.state.currency < trade.bOffer.currency) {
        send(a.ws, { type: 'trade_final', tradeId: trade.id, ok: false, reason: 'Insufficient currency', deltaCurrency: 0 });
        send(b.ws, { type: 'trade_final', tradeId: trade.id, ok: false, reason: 'Insufficient currency', deltaCurrency: 0 });
      } else {
        a.state.currency += trade.bOffer.currency - trade.aOffer.currency;
        b.state.currency += trade.aOffer.currency - trade.bOffer.currency;
        send(a.ws, { type: 'trade_final', tradeId: trade.id, ok: true, deltaCurrency: trade.bOffer.currency - trade.aOffer.currency });
        send(b.ws, { type: 'trade_final', tradeId: trade.id, ok: true, deltaCurrency: trade.aOffer.currency - trade.bOffer.currency });
      }
      trades.delete(trade.id);
      publishPresenceAndLeaderboard();
    }
  });

  ws.on('close', () => {
    players.delete(player.id);
    for (const [tradeId, trade] of trades) {
      if (trade.aId === player.id || trade.bId === player.id) {
        trades.delete(tradeId);
      }
    }
    publishPresenceAndLeaderboard();
  });
});

setInterval(() => {
  publishPresenceAndLeaderboard();
  if (seasonEvent && Date.now() >= seasonEndsAt) {
    seasonEvent = null;
    broadcast({ type: 'season_event', event: null });
  } else {
    setRandomSeasonEvent();
  }
}, 1000);

console.log(`Realtime server running on ws://localhost:${PORT}`);

