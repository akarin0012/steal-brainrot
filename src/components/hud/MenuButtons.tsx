import { useUIStore } from '../../stores/uiStore.ts';

export default function MenuButtons() {
  const openOverlay = useUIStore(s => s.openOverlay);
  const overlay = useUIStore(s => s.overlay);
  const isDev = import.meta.env.DEV;

  if (overlay !== 'none') return null;

  return (
    <div className="absolute left-3 top-3 z-40 flex flex-row gap-2">
      <SideButton label="Rebirth" shortcut="R" color="bg-purple-600 hover:bg-purple-500" onClick={() => openOverlay('rebirth')} />
      <SideButton label="Collection" shortcut="C" color="bg-amber-700 hover:bg-amber-600" onClick={() => openOverlay('collection')} />
      <SideButton label="Events" shortcut="E" color="bg-blue-700 hover:bg-blue-600" onClick={() => openOverlay('event_center')} />
      <SideButton label="Redeem" shortcut="X" color="bg-emerald-700 hover:bg-emerald-600" onClick={() => openOverlay('redeem')} />
      {isDev && (
        <SideButton label="Debug" shortcut="B" color="bg-red-700 hover:bg-red-600" onClick={() => openOverlay('debug')} />
      )}
    </div>
  );
}

function SideButton({ label, shortcut, color, onClick }: {
  label: string;
  shortcut: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-lg px-3 py-2 text-xs font-bold shadow-lg transition-colors cursor-pointer select-none min-w-[80px] text-center`}
    >
      <div>{label}</div>
      <div className="text-[10px] opacity-60">[{shortcut}]</div>
    </button>
  );
}
