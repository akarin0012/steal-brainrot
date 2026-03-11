import { useState, useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';
import GameCanvas from './components/GameCanvas.tsx';
import CurrencyHUD from './components/hud/CurrencyHUD.tsx';
import RebirthBadge from './components/hud/RebirthBadge.tsx';
import ShieldStatus from './components/hud/ShieldStatus.tsx';
import InteractPrompt from './components/hud/InteractPrompt.tsx';
import MenuButtons from './components/hud/MenuButtons.tsx';
import GearHUD from './components/hud/GearHUD.tsx';
import PityTimerHUD from './components/hud/PityTimerHUD.tsx';
import RebirthOverlay from './components/overlays/RebirthOverlay.tsx';
import CollectionOverlay from './components/overlays/CollectionOverlay.tsx';
import SlotOverlay from './components/overlays/SlotOverlay.tsx';
import OfflineModal from './components/overlays/OfflineModal.tsx';
import BaseInfoOverlay from './components/overlays/BaseInfoOverlay.tsx';
import NpcBaseStealOverlay from './components/overlays/NpcBaseStealOverlay.tsx';
import SlotReplaceOverlay from './components/overlays/SlotReplaceOverlay.tsx';
import FusionOverlay from './components/overlays/FusionOverlay.tsx';
import DebugOverlay from './components/overlays/DebugOverlay.tsx';
import { useUIStore } from './stores/uiStore.ts';

const GAME_W = 50 * 32;
const GAME_H = 30 * 32;

function OverlayRouter() {
  const overlay = useUIStore(s => s.overlay);
  const isDev = import.meta.env.DEV;

  switch (overlay) {
    case 'rebirth':         return <RebirthOverlay />;
    case 'collection':      return <CollectionOverlay />;
    case 'slot_detail':     return <SlotOverlay />;
    case 'offline_income':  return <OfflineModal />;
    case 'base_info':       return <BaseInfoOverlay />;
    case 'npc_base_steal':  return <NpcBaseStealOverlay />;
    case 'slot_replace':    return <SlotReplaceOverlay />;
    case 'fusion':          return <FusionOverlay />;
    case 'debug':           return isDev ? <DebugOverlay /> : null;
    default:                return null;
  }
}

function useViewportScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const s = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
      setScale(s);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
}

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
          <CurrencyHUD />
          <RebirthBadge />
          <ShieldStatus />
          <InteractPrompt />
          <MenuButtons />
          <GearHUD />
          <PityTimerHUD />
          <OverlayRouter />
        </div>
      </div>
    </ErrorBoundary>
  );
}
