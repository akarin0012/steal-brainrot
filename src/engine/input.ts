type KeyHandler = () => void;

class InputManager {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private onKeyHandlers = new Map<string, KeyHandler[]>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);

      if (e.repeat) return;

      const handlers = this.onKeyHandlers.get(e.code);
      if (handlers) {
        for (const h of handlers) h();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  clearFrame(): void {
    this.justPressed.clear();
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
