type KeyHandler = () => void;

const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'Space', 'Escape',
]);

class InputManager {
  private keys = new Set<string>();
  private onKeyHandlers = new Map<string, KeyHandler[]>();
  private abortCtrl: AbortController | null = null;

  constructor() {
    this.attach();
  }

  private attach() {
    this.abortCtrl?.abort();
    this.abortCtrl = new AbortController();
    const { signal } = this.abortCtrl;

    window.addEventListener('keydown', (e) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (e.target as HTMLElement)?.isContentEditable;
      if (GAME_KEYS.has(e.code) && !isInput) e.preventDefault();
      this.keys.add(e.code);

      if (e.repeat) return;

      const handlers = this.onKeyHandlers.get(e.code);
      if (handlers) {
        for (const h of handlers) h();
      }
    }, { signal });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    }, { signal });

    window.addEventListener('blur', () => {
      this.keys.clear();
    }, { signal });
  }

  dispose() {
    this.abortCtrl?.abort();
    this.keys.clear();
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  onKey(code: string, handler: KeyHandler): () => void {
    const list = this.onKeyHandlers.get(code) ?? [];
    list.push(handler);
    this.onKeyHandlers.set(code, list);
    return () => {
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  getMovement(): { dx: number; dy: number } {
    let dx = 0, dy = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp'))    dy = -1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown'))  dy = 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft'))  dx = -1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx = 1;
    return { dx, dy };
  }
}

export const input = new InputManager();

if (import.meta.hot) {
  import.meta.hot.dispose(() => input.dispose());
}
