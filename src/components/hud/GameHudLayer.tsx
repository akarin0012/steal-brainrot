import CurrencyHUD from './CurrencyHUD.tsx';
import RebirthBadge from './RebirthBadge.tsx';
import ShieldStatus from './ShieldStatus.tsx';
import InteractPrompt from './InteractPrompt.tsx';
import MenuButtons from './MenuButtons.tsx';
import GearHUD from './GearHUD.tsx';
import PityTimerHUD from './PityTimerHUD.tsx';

export default function GameHudLayer() {
  return (
    <>
      <CurrencyHUD />
      <RebirthBadge />
      <ShieldStatus />
      <InteractPrompt />
      <MenuButtons />
      <GearHUD />
      <PityTimerHUD />
    </>
  );
}
