import { useUIStore } from '../../stores/uiStore.ts';
import { MENU_HOTKEY_ENTRIES, DEBUG_OVERLAY_CODE } from '../../config/uiHotkeys.ts';

export default function MenuButtons() {
  const openOverlay = useUIStore(s => s.openOverlay);
  const overlay = useUIStore(s => s.overlay);
  const isDev = import.meta.env.DEV;

  if (overlay !== 'none') return null;

  return (
    <div className="absolute left-3 top-3 z-40 flex flex-row gap-2">
      {MENU_HOTKEY_ENTRIES.map((entry) => (
        <SideButton
          key={entry.code}
          label={entry.buttonLabel}
          shortcut={entry.shortcutLabel}
          color={entry.buttonClass}
          onClick={() => openOverlay(entry.overlay)}
        />
      ))}
      {isDev && (
        <SideButton
          label="Debug"
          shortcut={DEBUG_OVERLAY_CODE.replace('Key', '')}
          color="bg-red-700 hover:bg-red-600"
          onClick={() => openOverlay('debug')}
        />
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
      type="button"
      onClick={onClick}
      className={`${color} text-white rounded-lg px-3 py-2 text-xs font-bold shadow-lg transition-colors cursor-pointer select-none min-w-[80px] text-center`}
    >
      <div>{label}</div>
      <div className="text-[10px] opacity-60">[{shortcut}]</div>
    </button>
  );
}
