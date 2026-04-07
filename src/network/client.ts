import type { C2SMessage, S2CMessage } from './protocol.ts';

type MessageHandler = (msg: S2CMessage) => void;
type StatusHandler = (connected: boolean) => void;

const DEFAULT_URL = 'ws://localhost:8080';

class NetworkClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private manuallyClosed = false;
  private readonly messageHandlers = new Set<MessageHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private url = DEFAULT_URL;
  private name = 'Player';

  connect(url: string, name: string): void {
    this.url = url;
    this.name = name;
    this.manuallyClosed = false;
    this.openSocket();
  }

  disconnect(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.notifyStatus(false);
  }

  send(msg: C2SMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(msg));
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private openSocket(): void {
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener('open', () => {
      this.notifyStatus(true);
      this.send({ type: 'hello', name: this.name });
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as S2CMessage;
        this.messageHandlers.forEach((handler) => handler(parsed));
      } catch {
        // ignore malformed packets
      }
    });

    this.ws.addEventListener('close', () => {
      this.notifyStatus(false);
      this.ws = null;
      if (!this.manuallyClosed) this.scheduleReconnect();
    });

    this.ws.addEventListener('error', () => {
      this.notifyStatus(false);
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || this.manuallyClosed) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, 2000);
  }

  private notifyStatus(connected: boolean): void {
    this.statusHandlers.forEach((handler) => handler(connected));
  }
}

export const networkClient = new NetworkClient();

