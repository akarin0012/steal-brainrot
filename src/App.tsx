import ErrorBoundary from './components/common/ErrorBoundary.tsx';
import GameCanvas from './components/GameCanvas.tsx';
import GameHudLayer from './components/hud/GameHudLayer.tsx';
import OverlayRouter from './components/OverlayRouter.tsx';
import { GAME_W, GAME_H } from './constants/viewport.ts';
import { useViewportScale } from './hooks/useViewportScale.ts';

export default function App() {
  const scale = useViewportScale();

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen flex items-center justify-center bg-black overflow-hidden">
        <div
          className="relative"
          style={{
            width: GAME_W,
            height: GAME_H,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <GameCanvas />
          <GameHudLayer />
          <OverlayRouter />
        </div>
      </div>
    </ErrorBoundary>
  );
}
