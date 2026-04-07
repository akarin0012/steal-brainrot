import { useUIStore } from '../stores/uiStore.ts';
import RebirthOverlay from './overlays/RebirthOverlay.tsx';
import CollectionOverlay from './overlays/CollectionOverlay.tsx';
import SlotOverlay from './overlays/SlotOverlay.tsx';
import OfflineModal from './overlays/OfflineModal.tsx';
import BaseInfoOverlay from './overlays/BaseInfoOverlay.tsx';
import NpcBaseStealOverlay from './overlays/NpcBaseStealOverlay.tsx';
import SlotReplaceOverlay from './overlays/SlotReplaceOverlay.tsx';
import FusionOverlay from './overlays/FusionOverlay.tsx';
import DebugOverlay from './overlays/DebugOverlay.tsx';
import EventCenterOverlay from './overlays/EventCenterOverlay.tsx';
import RedeemOverlay from './overlays/RedeemOverlay.tsx';
import LeaderboardOverlay from './overlays/LeaderboardOverlay.tsx';
import TradeOverlay from './overlays/TradeOverlay.tsx';
import AchievementsOverlay from './overlays/AchievementsOverlay.tsx';

export default function OverlayRouter() {
  const overlay = useUIStore(s => s.overlay);
  const isDev = import.meta.env.DEV;

  switch (overlay) {
    case 'rebirth': return <RebirthOverlay />;
    case 'collection': return <CollectionOverlay />;
    case 'event_center': return <EventCenterOverlay />;
    case 'redeem': return <RedeemOverlay />;
    case 'leaderboard': return <LeaderboardOverlay />;
    case 'trade': return <TradeOverlay />;
    case 'achievements': return <AchievementsOverlay />;
    case 'slot_detail': return <SlotOverlay />;
    case 'offline_income': return <OfflineModal />;
    case 'base_info': return <BaseInfoOverlay />;
    case 'npc_base_steal': return <NpcBaseStealOverlay />;
    case 'slot_replace': return <SlotReplaceOverlay />;
    case 'fusion': return <FusionOverlay />;
    case 'debug': return isDev ? <DebugOverlay /> : null;
    default: return null;
  }
}
