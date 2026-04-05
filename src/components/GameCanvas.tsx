import { useRef, useEffect } from 'react';
import { GAME_W, GAME_H } from '../constants/viewport.ts';
import { runOfflineIncomeBootstrap } from '../game/offlineBootstrap.ts';
import { useGameCanvasRuntime } from '../hooks/useGameCanvasRuntime.ts';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offlineChecked = useRef(false);

  useEffect(() => {
    if (!offlineChecked.current) {
      offlineChecked.current = true;
      runOfflineIncomeBootstrap();
    }
  }, []);

  useGameCanvasRuntime(canvasRef);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_W}
      height={GAME_H}
      className="block"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
